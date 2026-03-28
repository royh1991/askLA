#!/usr/bin/env python3
"""
Submit meetings to Gemini 2.5 Flash Batch API for cleanup.

Selects meetings with both YT captions and agenda HTML,
builds batch requests, submits, and retrieves results.

Usage:
    # Prepare and submit batch
    python sample_pipeline/batch_clean.py prepare --limit 884 --submit

    # Check status
    python sample_pipeline/batch_clean.py status sample_pipeline/batches/batch_TIMESTAMP.json

    # Retrieve results
    python sample_pipeline/batch_clean.py retrieve sample_pipeline/batches/batch_TIMESTAMP.json

Cost: ~$0.003/meeting (Flash batch pricing). 884 meetings ≈ $2.65.
"""
import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
SCRIPT_DIR = Path(__file__).resolve().parent
YT_DIR = PROJECT_DIR / "youtube_experiments" / "yt_captions" / "transcripts"
OUTPUT_DIR = SCRIPT_DIR / "output"
BATCHES_DIR = SCRIPT_DIR / "batches"

# Load .env
_env_file = PROJECT_DIR / ".env"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip())

# Import the prompt
sys.path.insert(0, str(SCRIPT_DIR))

# Inline the prompt import to avoid module issues
sys.path.insert(0, "/tmp/askla_review")
from clean_meeting import SYSTEM_PROMPT


def strip_html(html):
    text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<[^>]+>', '\n', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return '\n'.join(l.strip() for l in text.split('\n') if l.strip())


def sanitize_title(title):
    title = re.sub(r'[^\w\s-]', '', title)
    title = re.sub(r'\s+', '_', title.strip())
    return title


def find_eligible_meetings(limit=1000):
    """Find meetings with both YT captions and agenda HTML."""
    with open(PROJECT_DIR / "manifest.json") as f:
        manifest = json.load(f)

    candidates = []
    for mf in YT_DIR.glob("*.meta.json"):
        with open(mf) as f:
            meta = json.load(f)
        mid = str(meta["meeting_id"])
        m = manifest.get(mid, {})
        doc_paths = m.get("doc_paths", [])
        agenda_htmls = [d for d in doc_paths if "Agenda" in d and d.endswith(".html")]
        if not agenda_htmls:
            continue

        title_safe = sanitize_title(meta["title"])
        txt_path = YT_DIR / f"m{mid}_{meta['date']}_{title_safe}.txt"
        if not txt_path.exists():
            continue

        candidates.append({
            "meeting_id": int(mid),
            "date": meta["date"],
            "title": meta["title"],
            "words": meta.get("total_words", 0),
            "transcript_path": str(txt_path),
            "agenda_path": agenda_htmls[0],
        })

    candidates.sort(key=lambda x: x["date"], reverse=True)
    return candidates[:limit]


def build_prompt_for_meeting(meeting):
    """Build the full Gemini prompt for a meeting."""
    transcript = Path(meeting["transcript_path"]).read_text()
    agenda_html = (PROJECT_DIR / meeting["agenda_path"]).read_text()
    agenda_text = strip_html(agenda_html)
    if len(agenda_text) > 10000:
        agenda_text = agenda_text[:10000] + "\n\n[... agenda truncated ...]"

    return (
        SYSTEM_PROMPT
        + f"\n## Meeting Info\n- Meeting ID: {meeting['meeting_id']}\n"
        + f"- Date: {meeting['date']}\n- Title: {meeting['title']}\n"
        + f"- Approximate word count: {meeting['words']}\n"
        + f"\n## AGENDA\n\n{agenda_text}\n"
        + f"\n## TRANSCRIPT\n\n{transcript}\n"
    )


def prepare_batch(meetings, model="gemini-2.5-flash", auto_submit=False):
    """Build and optionally submit a batch."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    BATCHES_DIR.mkdir(parents=True, exist_ok=True)

    # Skip already-processed meetings
    already_done = set()
    for f in OUTPUT_DIR.glob("*.json"):
        mid_match = re.match(r'm(\d+)_', f.name)
        if mid_match:
            already_done.add(int(mid_match.group(1)))

    pending = [m for m in meetings if m["meeting_id"] not in already_done]
    print(f"Total eligible: {len(meetings)}")
    print(f"Already processed: {len(already_done)}")
    print(f"Pending: {len(pending)}")

    if not pending:
        print("Nothing to do.")
        return

    # Build inline requests
    print(f"\nBuilding {len(pending)} requests...")
    requests = []
    meeting_index = []  # track order for result mapping

    for i, m in enumerate(pending):
        prompt = build_prompt_for_meeting(m)
        req = types.InlinedRequest(
            contents=[types.Content(parts=[types.Part(text=prompt)])],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
                max_output_tokens=65536,
            ),
        )
        requests.append(req)
        meeting_index.append(m)

        if (i + 1) % 100 == 0:
            print(f"  Built {i + 1}/{len(pending)} requests...")

    # Save state file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    state_file = BATCHES_DIR / f"batch_{timestamp}.json"
    state = {
        "created": datetime.now().isoformat(),
        "model": model,
        "meeting_count": len(pending),
        "meetings": {str(m["meeting_id"]): {
            "meeting_id": m["meeting_id"],
            "date": m["date"],
            "title": m["title"],
            "words": m["words"],
        } for m in meeting_index},
        "meeting_order": [m["meeting_id"] for m in meeting_index],
        "batch_name": None,
        "batch_state": None,
        "submitted_at": None,
        "completed_at": None,
        "results_retrieved": False,
    }

    if auto_submit:
        print(f"\nSubmitting batch: {len(requests)} requests, model={model}...")
        try:
            batch = client.batches.create(
                model=model,
                src=requests,
            )
            state["batch_name"] = batch.name
            state["batch_state"] = batch.state.name if batch.state else "UNKNOWN"
            state["submitted_at"] = datetime.now().isoformat()
            print(f"Batch submitted: {batch.name}")
            print(f"State: {state['batch_state']}")
        except Exception as e:
            print(f"ERROR submitting: {e}")
            return

    state_file.write_text(json.dumps(state, indent=2))
    print(f"\nState saved: {state_file}")
    if not auto_submit:
        print(f"Submit with: python sample_pipeline/batch_clean.py submit {state_file}")

    return str(state_file)


def check_status(state_file):
    """Check batch status."""
    from google import genai

    state = json.loads(Path(state_file).read_text())
    batch_name = state.get("batch_name")
    if not batch_name:
        print("Batch not yet submitted.")
        return

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    batch = client.batches.get(name=batch_name)

    state["batch_state"] = batch.state.name if batch.state else "UNKNOWN"
    Path(state_file).write_text(json.dumps(state, indent=2))

    print(f"Batch: {batch_name}")
    print(f"State: {state['batch_state']}")
    print(f"Meetings: {state['meeting_count']}")
    print(f"Submitted: {state.get('submitted_at', '?')}")

    if hasattr(batch, "done") and batch.done:
        print("Batch is DONE.")
        if state["batch_state"] == "JOB_STATE_SUCCEEDED":
            print(f"Retrieve with: python sample_pipeline/batch_clean.py retrieve {state_file}")
    else:
        print("Still processing. Check again later.")


def submit_batch(state_file):
    """Submit a prepared (but not yet submitted) batch."""
    from google import genai
    from google.genai import types

    state_path = Path(state_file)
    state = json.loads(state_path.read_text())

    if state.get("batch_name"):
        print(f"Already submitted: {state['batch_name']}")
        return

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    # Rebuild requests from meetings
    meetings = find_eligible_meetings(limit=10000)
    mid_set = set(state["meeting_order"])
    meetings = [m for m in meetings if m["meeting_id"] in mid_set]
    # Reorder to match original
    mid_to_meeting = {m["meeting_id"]: m for m in meetings}
    ordered = [mid_to_meeting[mid] for mid in state["meeting_order"] if mid in mid_to_meeting]

    requests = []
    for m in ordered:
        prompt = build_prompt_for_meeting(m)
        req = types.InlinedRequest(
            contents=[types.Content(parts=[types.Part(text=prompt)])],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
                max_output_tokens=65536,
            ),
        )
        requests.append(req)

    print(f"Submitting {len(requests)} requests...")
    batch = client.batches.create(model=state["model"], src=requests)

    state["batch_name"] = batch.name
    state["batch_state"] = batch.state.name if batch.state else "UNKNOWN"
    state["submitted_at"] = datetime.now().isoformat()
    state_path.write_text(json.dumps(state, indent=2))

    print(f"Submitted: {batch.name}")
    print(f"State: {state['batch_state']}")


def retrieve_batch(state_file):
    """Retrieve results from a completed batch."""
    from google import genai

    state_path = Path(state_file)
    state = json.loads(state_path.read_text())

    if state.get("results_retrieved"):
        print("Results already retrieved.")
        return

    batch_name = state.get("batch_name")
    if not batch_name:
        print("Batch not yet submitted.")
        return

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    batch = client.batches.get(name=batch_name)

    if not (hasattr(batch, "done") and batch.done):
        print(f"Batch not done yet. State: {batch.state.name if batch.state else 'UNKNOWN'}")
        return

    if batch.state.name != "JOB_STATE_SUCCEEDED":
        print(f"Batch did not succeed. State: {batch.state.name}")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    meeting_order = state["meeting_order"]
    meetings_meta = state["meetings"]

    responses = batch.dest.inlined_responses if hasattr(batch.dest, "inlined_responses") else []

    ok = err = 0
    for i, resp in enumerate(responses):
        if i >= len(meeting_order):
            break

        mid = meeting_order[i]
        mstate = meetings_meta[str(mid)]
        title_safe = sanitize_title(mstate["title"])
        out_path = OUTPUT_DIR / f"m{mid}_{mstate['date']}_{title_safe}.json"

        if hasattr(resp, "error") and resp.error:
            print(f"  m{mid} ERROR: {resp.error}")
            err += 1
            continue

        try:
            raw_text = resp.response.text
            result = json.loads(raw_text)
            with open(out_path, "w") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            ok += 1
        except json.JSONDecodeError as e:
            # Save raw for debugging
            raw_path = out_path.with_suffix(".raw.txt")
            raw_path.write_text(raw_text)
            print(f"  m{mid} JSON ERROR: {e}")
            err += 1
        except Exception as e:
            print(f"  m{mid} ERROR: {e}")
            err += 1

    state["results_retrieved"] = True
    state["completed_at"] = datetime.now().isoformat()
    state_path.write_text(json.dumps(state, indent=2))

    print(f"\nDone: {ok} retrieved, {err} errors")
    print(f"Output: {OUTPUT_DIR}")


def main():
    parser = argparse.ArgumentParser(description="Batch cleanup via Gemini")
    sub = parser.add_subparsers(dest="command")

    prep = sub.add_parser("prepare", help="Select meetings and submit batch")
    prep.add_argument("--limit", type=int, default=1000)
    prep.add_argument("--submit", action="store_true", help="Auto-submit after building")
    prep.add_argument("--model", default="gemini-2.5-flash")

    stat = sub.add_parser("status", help="Check batch status")
    stat.add_argument("state_file")

    subm = sub.add_parser("submit", help="Submit a prepared batch")
    subm.add_argument("state_file")

    ret = sub.add_parser("retrieve", help="Retrieve completed results")
    ret.add_argument("state_file")

    args = parser.parse_args()

    if args.command == "prepare":
        meetings = find_eligible_meetings(limit=args.limit)
        prepare_batch(meetings, model=args.model, auto_submit=args.submit)
    elif args.command == "status":
        check_status(args.state_file)
    elif args.command == "submit":
        submit_batch(args.state_file)
    elif args.command == "retrieve":
        retrieve_batch(args.state_file)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
