#!/usr/bin/env python3
"""
Process LA City Council meeting audio with Gemini API.

Uploads audio files to Gemini's Files API, then generates structured JSON
transcripts with speaker identification, vote tracking, timestamps, and
housing policy analysis, plus a raw verbatim transcript.

Usage:
    python process_meeting.py audio/m17900_2026-03-11_Transportation_Committee.mp3
    python process_meeting.py audio/ transcripts/                       # Batch mode
    python process_meeting.py audio/file.mp3 --model gemini-2.5-flash-lite
    python process_meeting.py audio/file.mp3 --meeting-id 17900        # Embed meeting_id

Output:
    transcripts/
    ├── m17900_2026-03-11_Transportation_Committee.json   # structured analysis
    ├── m17900_2026-03-11_Transportation_Committee.txt    # raw transcript
    └── ...

Requires: GEMINI_API_KEY environment variable.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
TRANSCRIPTS_DIR = PROJECT_DIR / "transcripts"

# Model options (see project.md for cost estimates):
# - gemini-2.5-flash-lite: ~$0.10/3hr meeting (cheapest)
# - gemini-2.5-flash: ~$0.35/3hr meeting (good balance)
DEFAULT_MODEL = "gemini-2.5-flash"

SYSTEM_PROMPT = """You are an expert analyst of Los Angeles City Council \
and committee meetings. Your task is to process the audio of a meeting \
and produce TWO outputs separated by a delimiter.

You MUST cover the ENTIRE meeting from start to finish. Do not skip or truncate \
any portion of the audio.

Current LA City Council members (as of early 2026):
- Eunisses Hernandez (CD1)
- Paul Krekorian (CD2)
- Bob Blumenfield (CD3, President Pro Tempore)
- Nithya Raman (CD4, Asst. President Pro Tempore)
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

===== OUTPUT FORMAT =====

Your response MUST have exactly two sections separated by this exact line:
---TRANSCRIPT---

SECTION 1 (before the separator): Structured JSON analysis.
SECTION 2 (after the separator): Full verbatim transcript as plain text.

===== SECTION 1: JSON ANALYSIS =====

Output valid JSON (no markdown fences) with this structure:
{
  "meeting_date": "YYYY-MM-DD",
  "meeting_type": "City Council | PLUM Committee | Housing Committee | etc.",
  "duration_minutes": 180,
  "items_discussed": [
    {
      "council_file": "XX-XXXX or null",
      "topic": "Brief topic description",
      "summary": "2-4 sentence summary of discussion",
      "speakers": [
        {
          "name": "Council Member Name",
          "role": "Council Member | Staff | Public Commenter",
          "position": "Support | Oppose | Neutral | N/A",
          "key_quotes_paraphrased": "What they argued"
        }
      ],
      "vote": {
        "result": "Passed | Failed | Tabled | No Vote",
        "ayes": 0,
        "nays": 0,
        "abstentions": 0
      },
      "timestamp_start": "HH:MM:SS",
      "timestamp_end": "HH:MM:SS",
      "housing_relevant": true,
      "housing_tags": ["zoning", "affordable", "permits", "density", "EO1"]
    }
  ],
  "housing_summary": "Overall summary of housing-related activity in this meeting"
}

Every segment of the audio must appear in exactly one item. Pay special attention \
to items related to housing, zoning, density, building permits, affordable housing, \
homelessness programs, EO1 streamlining, CEQA exemptions, RHNA, and housing \
production targets.

===== SECTION 2: RAW TRANSCRIPT =====

After the ---TRANSCRIPT--- separator, write a complete verbatim transcript of the \
entire meeting as plain text. Format:
- Label each speaker: "Council Member Park:", "City Clerk:", "Public Commenter (name):", etc.
- Include timestamps in [HH:MM:SS] at natural breaks (every few minutes or at speaker changes).
- Transcribe everything spoken. Do not summarize or skip any portion.
- This section is plain text, NOT JSON."""

TRANSCRIPT_SEPARATOR = "---TRANSCRIPT---"

AUDIO_EXTENSIONS = frozenset({".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac", ".webm"})


# ---------------------------------------------------------------------------
# Gemini client
# ---------------------------------------------------------------------------

def init_client():
    """Initialize Gemini client. Exported for use by batch_processing.py."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set.")
        print("Get a key from https://aistudio.google.com/apikey")
        sys.exit(1)

    from google import genai
    return genai.Client(api_key=api_key)


# ---------------------------------------------------------------------------
# Response parsing (reusable by batch_processing.py)
# ---------------------------------------------------------------------------

def parse_gemini_response(raw_text, meeting_id=None):
    """Parse Gemini response into (analysis_dict, transcript_text).

    The response has two sections separated by ---TRANSCRIPT---.
    Optionally embeds meeting_id into the analysis dict.
    """
    raw = raw_text.strip()

    if TRANSCRIPT_SEPARATOR in raw:
        json_part, transcript = raw.split(TRANSCRIPT_SEPARATOR, 1)
    else:
        json_part = raw
        transcript = ""

    json_part = json_part.strip()
    if json_part.startswith("```"):
        json_part = json_part.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    analysis = json.loads(json_part)
    transcript = transcript.strip()

    if meeting_id is not None:
        analysis["meeting_id"] = meeting_id

    return analysis, transcript


# ---------------------------------------------------------------------------
# Upload + process (synchronous, single meeting)
# ---------------------------------------------------------------------------

def upload_and_process(client, audio_path, model=DEFAULT_MODEL, meeting_id=None):
    """Upload audio file and process with Gemini.

    Returns (analysis_dict, transcript_text) tuple.
    Single API call produces both structured JSON and raw transcript.
    """
    from google.genai import types

    audio_path = Path(audio_path)
    size_mb = audio_path.stat().st_size / (1024 * 1024)
    print(f"  Uploading {audio_path.name} ({size_mb:.1f} MB)...")

    uploaded_file = client.files.upload(file=str(audio_path))

    # Wait for file to be processed
    while uploaded_file.state.name == "PROCESSING":
        print("    Waiting for server-side processing...")
        time.sleep(5)
        uploaded_file = client.files.get(name=uploaded_file.name)

    if uploaded_file.state.name == "FAILED":
        raise Exception(f"File processing failed: {uploaded_file.state}")

    print(f"  File ready. Generating analysis + transcript with {model}...")

    response = client.models.generate_content(
        model=model,
        contents=[
            uploaded_file,
            SYSTEM_PROMPT,
        ],
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=65536,
        ),
    )

    # Clean up uploaded file from Gemini storage
    try:
        client.files.delete(name=uploaded_file.name)
    except Exception:
        pass  # Non-critical; files expire after 48h anyway

    raw = response.text.strip()
    if TRANSCRIPT_SEPARATOR not in raw:
        print("  WARNING: No transcript separator found in response")

    return parse_gemini_response(raw, meeting_id=meeting_id)


# ---------------------------------------------------------------------------
# File output helpers
# ---------------------------------------------------------------------------

def save_results(analysis, transcript, json_path, txt_path=None):
    """Write analysis JSON and transcript TXT to disk."""
    json_path = Path(json_path)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(analysis, indent=2))
    print(f"  Saved analysis: {json_path}")

    if transcript:
        if txt_path is None:
            txt_path = json_path.with_suffix(".txt")
        txt_path = Path(txt_path)
        txt_path.write_text(transcript, encoding="utf-8")
        print(f"  Saved transcript: {txt_path}")


# ---------------------------------------------------------------------------
# Single file processing
# ---------------------------------------------------------------------------

def process_single(audio_path, output_path=None, model=DEFAULT_MODEL, meeting_id=None):
    """Process a single audio file. Returns the analysis dict."""
    client = init_client()
    audio_path = Path(audio_path)

    if output_path is None:
        TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
        output_path = TRANSCRIPTS_DIR / (audio_path.stem + ".json")
    output_path = Path(output_path)

    if output_path.exists():
        print(f"  Skipping {audio_path.name} (already processed: {output_path.name})")
        return json.loads(output_path.read_text())

    print(f"Processing: {audio_path.name}")
    analysis, transcript = upload_and_process(client, audio_path, model=model, meeting_id=meeting_id)

    save_results(analysis, transcript, output_path)
    return analysis


# ---------------------------------------------------------------------------
# Directory batch processing (synchronous, one-by-one)
# ---------------------------------------------------------------------------

def process_batch(audio_dir, output_dir=None, model=DEFAULT_MODEL):
    """Process all audio files in a directory (synchronously)."""
    audio_dir = Path(audio_dir)
    if output_dir is None:
        output_dir = TRANSCRIPTS_DIR
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    client = init_client()

    audio_files = sorted([
        f for f in audio_dir.iterdir()
        if f.suffix.lower() in AUDIO_EXTENSIONS
    ])

    if not audio_files:
        print(f"No audio files found in {audio_dir}")
        return

    print(f"Found {len(audio_files)} audio files to process.")

    ok = err = skipped = 0
    for audio_file in audio_files:
        output_file = output_dir / (audio_file.stem + ".json")

        if output_file.exists():
            print(f"  Skipping {audio_file.name} (already processed)")
            skipped += 1
            continue

        # Extract meeting_id from filename if it follows m{id}_... convention
        mid = None
        if audio_file.stem.startswith("m") and "_" in audio_file.stem:
            try:
                mid = int(audio_file.stem.split("_")[0][1:])
            except ValueError:
                pass

        try:
            print(f"Processing: {audio_file.name}")
            analysis, transcript = upload_and_process(client, audio_file, model=model, meeting_id=mid)
            save_results(analysis, transcript, output_file)
            ok += 1
            time.sleep(2)
        except Exception as e:
            print(f"  ERROR: {e}")
            err += 1
            continue

    print(f"\nDone: {ok} processed, {skipped} skipped, {err} errors")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Process meeting audio with Gemini API")
    parser.add_argument("input", help="Audio file or directory of audio files")
    parser.add_argument("output", nargs="?", help="Output JSON file or directory (default: transcripts/)")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Gemini model to use (default: {DEFAULT_MODEL})")
    parser.add_argument("--meeting-id", type=int, help="Meeting ID to embed in output JSON")

    args = parser.parse_args()
    input_path = Path(args.input)

    if input_path.is_dir():
        process_batch(input_path, args.output, model=args.model)
    elif input_path.is_file():
        process_single(input_path, args.output, model=args.model, meeting_id=args.meeting_id)
    else:
        print(f"ERROR: {input_path} not found")
        sys.exit(1)


if __name__ == "__main__":
    main()
