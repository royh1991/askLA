#!/usr/bin/env python3
"""
Process sample meetings through Gemini Flash to produce clean, agenda-aligned transcripts.

For each meeting:
1. Reads the raw YouTube caption transcript
2. Reads the HTML agenda (strips to text)
3. Sends both to Gemini Flash with a carefully crafted prompt
4. Outputs a structured JSON per meeting, chunked by agenda item

Usage:
    # Select the sample (run once)
    python sample_pipeline/select_sample.py

    # Process synchronously (one at a time, ~$0.003/meeting)
    python sample_pipeline/process_sample.py

    # Process specific meeting
    python sample_pipeline/process_sample.py --meeting-id 17889

    # Dry run (show what would be processed)
    python sample_pipeline/process_sample.py --dry-run

Output:
    sample_pipeline/output/m{id}_{date}_{title}.json

Cost: ~$0.003/meeting sync, ~$0.0015/meeting batch. 100 meetings ≈ $0.15-0.30.
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
SAMPLE_PLAN = SCRIPT_DIR / "sample_plan.json"
OUTPUT_DIR = SCRIPT_DIR / "output"

# Load .env
_env_file = PROJECT_DIR / ".env"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip())


from prompt_v2 import PROMPT_V2

PROMPT = PROMPT_V2

PROMPT_V1 = """\
You are processing a Los Angeles City Council or committee meeting. You have two inputs:

1. **AGENDA** — the official meeting agenda listing items to be discussed, with council file numbers and descriptions.
2. **TRANSCRIPT** — a raw caption transcript from the meeting video. This was produced by live CART captioning and contains typos, garbled words, missing punctuation, and fragmented sentences.

Your task is to produce a **clean, structured transcript** organized by agenda item. This will be used for search and retrieval in a vector database.

## Output Format

Return valid JSON with this structure:

```json
{
  "meeting_id": <number>,
  "date": "YYYY-MM-DD",
  "title": "Committee or Council name",
  "sections": [
    {
      "section_type": "procedural | agenda_item | public_comment | other",
      "agenda_item_number": <number or null>,
      "council_file": "XX-XXXX" or null,
      "topic": "Brief topic description (1 sentence)",
      "speakers": [
        {
          "name": "Speaker Name",
          "role": "Council Member | Committee Chair | City Staff | Public Commenter | City Clerk | Unknown",
          "summary": "1-2 sentence summary of what they said"
        }
      ],
      "vote": {
        "result": "Passed | Failed | Tabled | Continued | No Vote",
        "detail": "Unanimous / 12-0 / etc. or null"
      },
      "clean_transcript": "The full cleaned-up transcript text for this section. Fix typos, merge fragments into proper sentences, add punctuation. Preserve the speaker's words as faithfully as possible — fix garbled text but do not rephrase or summarize. Label speakers where identifiable (e.g., 'Council Member Park: ...'). Use paragraph breaks between speakers."
    }
  ]
}
```

## Rules

1. **Every part of the transcript must appear in exactly one section.** Do not skip or omit any portion.
2. **Align sections to agenda items** using the agenda as your guide. Match transcript segments to their corresponding agenda item by topic, council file number, or context.
3. **Procedural sections** (roll call, approval of minutes, moment of silence, adjournment) should be their own sections with `section_type: "procedural"`.
4. **Public comment** periods should be their own section(s) with `section_type: "public_comment"`.
5. **Fix the transcript text** — correct obvious typos, merge the 2-4 word fragments into full sentences, add proper capitalization and punctuation. But stay faithful to what was actually said.
6. **Speaker identification** — use the agenda's list of council members and the transcript context to identify speakers. When uncertain, use "Unknown Speaker" or "Staff Presenter".
7. **Council file numbers** — extract from the agenda and attach to the matching section.
8. **Votes** — note the result if a vote was taken on the item.
9. The `clean_transcript` field should be the **full cleaned text**, not a summary. It should be readable as a transcript.

## Important Context

Current LA City Council members (2025-2026):
- Eunisses Hernandez (CD1)
- Paul Krekorian (CD2)
- Bob Blumenfield (CD3)
- Nithya Raman (CD4)
- Katy Yaroslavsky (CD5)
- Imelda Padilla (CD6)
- Monica Rodriguez (CD7)
- Marqueece Harris-Dawson (CD8, Council President)
- Curren Price (CD9)
- Heather Hutt (CD10)
- Traci Park (CD11)
- John Lee (CD12)
- Hugo Soto-Martinez (CD13)
- Kevin de Leon (CD14)
- Tim McOsker (CD15)

Now process this meeting:
"""


def strip_html_to_text(html_content):
    """Convert HTML agenda to clean text."""
    # Remove scripts and styles
    text = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
    # Convert common entities
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    # Replace tags with newlines
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<[^>]+>', '\n', text)
    # Clean up whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return '\n'.join(lines)


def process_meeting(meeting, client, model="gemini-2.5-flash"):
    """Process a single meeting through Gemini."""
    mid = meeting["meeting_id"]
    date = meeting["date"]
    title = meeting["title"]

    # Read transcript
    transcript_path = PROJECT_DIR / meeting["transcript_path"]
    transcript = transcript_path.read_text()

    # Read and strip agenda HTML
    agenda_path = PROJECT_DIR / meeting["agenda_path"]
    agenda_html = agenda_path.read_text()
    agenda_text = strip_html_to_text(agenda_html)

    # Truncate agenda if too long (keep first 8000 chars — the items list)
    if len(agenda_text) > 8000:
        agenda_text = agenda_text[:8000] + "\n\n[... agenda truncated for length ...]"

    # Build the full prompt
    full_prompt = (
        PROMPT
        + f"\n## Meeting Info\n- Meeting ID: {mid}\n- Date: {date}\n- Title: {title}\n"
        + f"\n## AGENDA\n\n{agenda_text}\n"
        + f"\n## TRANSCRIPT\n\n{transcript}\n"
    )

    # Call Gemini
    response = client.models.generate_content(
        model=model,
        contents=full_prompt,
        config={
            "response_mime_type": "application/json",
            "temperature": 0.1,
            "max_output_tokens": 65536,
        },
    )

    return response.text


def main():
    parser = argparse.ArgumentParser(description="Process sample meetings through Gemini")
    parser.add_argument("--meeting-id", type=int, help="Process a single meeting")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, help="Process only first N meetings")
    parser.add_argument("--model", default="gemini-2.5-flash")
    args = parser.parse_args()

    if not SAMPLE_PLAN.exists():
        print("Run select_sample.py first to create sample_plan.json")
        sys.exit(1)

    with open(SAMPLE_PLAN) as f:
        sample = json.load(f)

    if args.meeting_id:
        sample = [m for m in sample if m["meeting_id"] == args.meeting_id]

    if args.limit:
        sample = sample[:args.limit]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Skip already processed
    done = set()
    for f in OUTPUT_DIR.glob("*.json"):
        mid_match = re.match(r'm(\d+)_', f.name)
        if mid_match:
            done.add(int(mid_match.group(1)))

    pending = [m for m in sample if m["meeting_id"] not in done]
    print(f"Total: {len(sample)}, already done: {len(done)}, pending: {len(pending)}")

    if args.dry_run:
        for m in pending[:10]:
            print(f"  m{m['meeting_id']} {m['date']} {m['title'][:50]} ({m['total_words']} words)")
        if len(pending) > 10:
            print(f"  ... and {len(pending) - 10} more")
        total_words = sum(m["total_words"] for m in pending)
        est_cost = total_words * 1.3 / 1_000_000 * (0.15 + 0.60)  # input + output tokens, sync pricing
        print(f"\nEstimated cost: ${est_cost:.2f} (sync pricing)")
        return

    if not pending:
        print("Nothing to do.")
        return

    # Init Gemini
    from google import genai
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)
    client = genai.Client(api_key=api_key)

    success = fail = 0
    start_time = time.time()

    for i, meeting in enumerate(pending, 1):
        mid = meeting["meeting_id"]
        title_safe = re.sub(r'[^\w\s-]', '', meeting["title"])
        title_safe = re.sub(r'\s+', '_', title_safe.strip())
        out_path = OUTPUT_DIR / f"m{mid}_{meeting['date']}_{title_safe}.json"

        try:
            print(f"  [{i}/{len(pending)}] m{mid} {meeting['date']} {meeting['title'][:40]}...", end=" ", flush=True)

            result_text = process_meeting(meeting, client, model=args.model)

            # Parse and validate JSON
            result = json.loads(result_text)

            # Save
            with open(out_path, "w") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)

            sections = len(result.get("sections", []))
            print(f"OK ({sections} sections)")
            success += 1

        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            # Save raw text for debugging
            raw_path = out_path.with_suffix(".raw.txt")
            raw_path.write_text(result_text)
            fail += 1

        except Exception as e:
            print(f"ERROR: {str(e)[:80]}")
            fail += 1

        # Rate limit: ~10 RPM for free tier
        time.sleep(6)

    elapsed = time.time() - start_time
    print(f"\nDone in {elapsed/60:.1f} minutes")
    print(f"  Success: {success}")
    print(f"  Failed:  {fail}")


if __name__ == "__main__":
    main()
