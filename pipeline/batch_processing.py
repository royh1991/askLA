#!/usr/bin/env python3
"""
Gemini Batch API integration for bulk meeting processing.

Three-phase workflow: prepare -> submit -> retrieve.
Gives 50% cost savings vs synchronous API calls, with ~24h turnaround.

Usage (via pipeline.py):
    python pipeline.py --batch-prepare --date-range 2025-01-01:2025-12-31 --submit
    python pipeline.py --batch-status batches/batch_TIMESTAMP.json
    python pipeline.py --batch-retrieve batches/batch_TIMESTAMP.json

Or directly:
    python batch_processing.py prepare --meetings 17900 17901 17902
    python batch_processing.py submit batches/batch_TIMESTAMP.json
    python batch_processing.py status batches/batch_TIMESTAMP.json
    python batch_processing.py retrieve batches/batch_TIMESTAMP.json
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

from download_audio import meeting_audio_filename, _sanitize

PROJECT_DIR = Path(__file__).resolve().parent
AUDIO_DIR = PROJECT_DIR / "audio"
TRANSCRIPTS_DIR = PROJECT_DIR / "transcripts"
BATCHES_DIR = PROJECT_DIR / "batches"

# Max meetings per batch (stay within 48h file expiry window)
CHUNK_SIZE = 200


def _init_client():
    """Initialize Gemini client."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set.")
        sys.exit(1)
    from google import genai
    return genai.Client(api_key=api_key)


def _audio_path_for_meeting(meeting):
    """Return the expected audio path for a meeting."""
    filename = meeting_audio_filename(meeting)
    return AUDIO_DIR / filename


def _transcript_stem(meeting):
    """Return canonical transcript stem: m{id}_{date}_{title}."""
    mid = meeting["id"]
    date = meeting["dateTime"][:10]
    title = _sanitize(meeting["title"])
    return f"m{mid}_{date}_{title}"


# ---------------------------------------------------------------------------
# Phase 1: Prepare
# ---------------------------------------------------------------------------

def prepare_batch(meetings, model="gemini-2.5-flash"):
    """Upload audio files to Gemini and build batch state file.

    Args:
        meetings: list of meeting dicts (must have audio downloaded)
        model: Gemini model name

    Returns:
        Path to the batch state file, or None on failure.
    """
    from process_meeting import SYSTEM_PROMPT

    # Filter to meetings that have audio downloaded
    ready = []
    for m in meetings:
        audio_path = _audio_path_for_meeting(m)
        if audio_path.exists():
            ready.append(m)
        else:
            print(f"  Skipping m{m['id']} ({m['title']}): no audio at {audio_path.name}")

    if not ready:
        print("No meetings with downloaded audio found. Download audio first.")
        return None

    # Check for already-processed meetings
    unprocessed = []
    for m in ready:
        stem = _transcript_stem(m)
        json_path = TRANSCRIPTS_DIR / f"{stem}.json"
        if json_path.exists():
            print(f"  Skipping m{m['id']}: transcript already exists")
        else:
            unprocessed.append(m)

    if not unprocessed:
        print("All meetings already have transcripts.")
        return None

    # Chunk if needed
    if len(unprocessed) > CHUNK_SIZE:
        print(f"  {len(unprocessed)} meetings exceed chunk size {CHUNK_SIZE}.")
        print(f"  Processing first {CHUNK_SIZE}. Re-run for remaining.")
        unprocessed = unprocessed[:CHUNK_SIZE]

    print(f"\nPreparing batch for {len(unprocessed)} meetings...")

    client = _init_client()

    # Upload audio files and build request list
    meeting_states = {}
    for m in unprocessed:
        audio_path = _audio_path_for_meeting(m)
        mid = m["id"]
        size_mb = audio_path.stat().st_size / (1024 * 1024)
        print(f"  Uploading m{mid} ({m['title']}, {size_mb:.1f} MB)...")

        try:
            uploaded = client.files.upload(file=str(audio_path))

            # Wait for processing
            while uploaded.state.name == "PROCESSING":
                time.sleep(3)
                uploaded = client.files.get(name=uploaded.name)

            if uploaded.state.name == "FAILED":
                print(f"    FAILED: file processing failed")
                continue

            meeting_states[str(mid)] = {
                "meeting_id": mid,
                "title": m["title"],
                "date": m["dateTime"][:10],
                "audio_path": str(audio_path.relative_to(PROJECT_DIR)),
                "gemini_file_name": uploaded.name,
                "gemini_file_uri": uploaded.uri,
            }
            print(f"    Uploaded: {uploaded.name}")

        except Exception as e:
            print(f"    ERROR uploading: {e}")
            continue

    if not meeting_states:
        print("No files uploaded successfully.")
        return None

    # Save state file
    BATCHES_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    state_file = BATCHES_DIR / f"batch_{timestamp}.json"

    state = {
        "created": datetime.now().isoformat(),
        "model": model,
        "prompt": SYSTEM_PROMPT,
        "meetings": meeting_states,
        "batch_name": None,
        "batch_state": None,
        "submitted_at": None,
        "completed_at": None,
        "results_retrieved": False,
    }

    state_file.write_text(json.dumps(state, indent=2))
    print(f"\nBatch state saved: {state_file}")
    print(f"  {len(meeting_states)} meetings ready for submission.")
    print(f"  Submit with: python pipeline.py --batch-submit {state_file}")

    return str(state_file)


# ---------------------------------------------------------------------------
# Phase 2: Submit
# ---------------------------------------------------------------------------

def submit_batch(state_file):
    """Submit a prepared batch to Gemini Batch API.

    Args:
        state_file: path to the batch state JSON file
    """
    from google.genai import types

    state_file = Path(state_file)
    state = json.loads(state_file.read_text())

    if state.get("batch_name"):
        print(f"Batch already submitted: {state['batch_name']}")
        print(f"Check status with: python pipeline.py --batch-status {state_file}")
        return

    client = _init_client()
    model = state["model"]
    prompt = state["prompt"]

    # Build inline requests
    requests = []
    for mid, mstate in state["meetings"].items():
        file_uri = mstate["gemini_file_uri"]
        file_name = mstate["gemini_file_name"]

        req = types.InlinedRequest(
            contents=[
                types.Content(parts=[types.Part(file_data=types.FileData(
                    file_uri=file_uri, mime_type="audio/mpeg"
                ))]),
                types.Content(parts=[types.Part(text=prompt)]),
            ],
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=65536,
            ),
        )
        requests.append(req)

    print(f"Submitting batch: {len(requests)} requests, model={model}...")

    try:
        batch = client.batches.create(
            model=model,
            src=requests,
        )
    except Exception as e:
        print(f"ERROR submitting batch: {e}")
        return

    state["batch_name"] = batch.name
    state["batch_state"] = batch.state.name if batch.state else "UNKNOWN"
    state["submitted_at"] = datetime.now().isoformat()
    state_file.write_text(json.dumps(state, indent=2))

    print(f"Batch submitted: {batch.name}")
    print(f"State: {state['batch_state']}")
    print(f"Check status: python pipeline.py --batch-status {state_file}")


# ---------------------------------------------------------------------------
# Phase 2.5: Poll
# ---------------------------------------------------------------------------

def poll_batch(state_file):
    """Check status of a submitted batch job."""
    state_file = Path(state_file)
    state = json.loads(state_file.read_text())

    batch_name = state.get("batch_name")
    if not batch_name:
        print("Batch not yet submitted.")
        return

    client = _init_client()
    batch = client.batches.get(name=batch_name)

    state["batch_state"] = batch.state.name if batch.state else "UNKNOWN"
    state_file.write_text(json.dumps(state, indent=2))

    print(f"Batch: {batch_name}")
    print(f"State: {state['batch_state']}")
    print(f"Submitted: {state.get('submitted_at', '?')}")

    if hasattr(batch, "done") and batch.done:
        print("Batch is DONE.")
        if state["batch_state"] == "JOB_STATE_SUCCEEDED":
            print(f"Retrieve with: python pipeline.py --batch-retrieve {state_file}")
        else:
            print(f"Batch ended with state: {state['batch_state']}")
            if hasattr(batch, "error") and batch.error:
                print(f"Error: {batch.error}")
    else:
        print("Still processing. Check again later.")


# ---------------------------------------------------------------------------
# Phase 3: Retrieve
# ---------------------------------------------------------------------------

def retrieve_batch(state_file):
    """Retrieve results from a completed batch job."""
    from process_meeting import parse_gemini_response, save_results

    state_file = Path(state_file)
    state = json.loads(state_file.read_text())

    if state.get("results_retrieved"):
        print("Results already retrieved.")
        return

    batch_name = state.get("batch_name")
    if not batch_name:
        print("Batch not yet submitted.")
        return

    client = _init_client()
    batch = client.batches.get(name=batch_name)

    if not (hasattr(batch, "done") and batch.done):
        print(f"Batch not done yet. State: {batch.state.name if batch.state else 'UNKNOWN'}")
        return

    if batch.state.name != "JOB_STATE_SUCCEEDED":
        print(f"Batch did not succeed. State: {batch.state.name}")
        if hasattr(batch, "error") and batch.error:
            print(f"Error: {batch.error}")
        return

    print(f"Retrieving results for {len(state['meetings'])} meetings...")

    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

    # Get inline responses
    responses = batch.dest.inlined_responses if hasattr(batch.dest, "inlined_responses") else []

    # Map responses back to meetings by order
    meeting_ids = list(state["meetings"].keys())

    ok = err = 0
    for i, resp in enumerate(responses):
        if i >= len(meeting_ids):
            break

        mid = meeting_ids[i]
        mstate = state["meetings"][mid]

        if hasattr(resp, "error") and resp.error:
            print(f"  m{mid} ERROR: {resp.error}")
            err += 1
            continue

        try:
            raw_text = resp.response.text
            analysis, transcript = parse_gemini_response(raw_text, meeting_id=int(mid))

            stem = f"m{mid}_{mstate['date']}_{_sanitize(mstate['title'])}"
            json_path = TRANSCRIPTS_DIR / f"{stem}.json"
            txt_path = TRANSCRIPTS_DIR / f"{stem}.txt"

            save_results(analysis, transcript, json_path, txt_path)
            ok += 1
        except Exception as e:
            print(f"  m{mid} PARSE ERROR: {e}")
            err += 1

    # Clean up Gemini uploaded files
    print("Cleaning up uploaded files...")
    for mid, mstate in state["meetings"].items():
        try:
            client.files.delete(name=mstate["gemini_file_name"])
        except Exception:
            pass

    state["results_retrieved"] = True
    state["completed_at"] = datetime.now().isoformat()
    state_file.write_text(json.dumps(state, indent=2))

    print(f"\nDone: {ok} retrieved, {err} errors")
    print("Run 'python build_manifest.py' to update the manifest.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Gemini Batch API processing")
    subparsers = parser.add_subparsers(dest="command")

    prep = subparsers.add_parser("prepare", help="Upload audio and prepare batch")
    prep.add_argument("--meetings", type=int, nargs="+", help="Meeting IDs to include")
    prep.add_argument("--model", default="gemini-2.5-flash")
    prep.add_argument("--submit", action="store_true", help="Auto-submit after prepare")

    sub = subparsers.add_parser("submit", help="Submit a prepared batch")
    sub.add_argument("state_file", help="Batch state JSON file")

    stat = subparsers.add_parser("status", help="Check batch status")
    stat.add_argument("state_file", help="Batch state JSON file")

    ret = subparsers.add_parser("retrieve", help="Retrieve batch results")
    ret.add_argument("state_file", help="Batch state JSON file")

    args = parser.parse_args()

    if args.command == "prepare":
        if not args.meetings:
            print("ERROR: --meetings required")
            return
        # Load meeting dicts from all_meetings.json
        meetings_data = json.loads((PROJECT_DIR / "all_meetings.json").read_text())
        id_set = set(args.meetings)
        meetings = []
        for _year, mlist in meetings_data.items():
            for m in mlist:
                if m["id"] in id_set:
                    meetings.append(m)
        if not meetings:
            print(f"No meetings found for IDs: {args.meetings}")
            return
        state_file = prepare_batch(meetings, model=args.model)
        if args.submit and state_file:
            submit_batch(state_file)

    elif args.command == "submit":
        submit_batch(args.state_file)
    elif args.command == "status":
        poll_batch(args.state_file)
    elif args.command == "retrieve":
        retrieve_batch(args.state_file)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
