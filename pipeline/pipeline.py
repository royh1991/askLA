#!/usr/bin/env python3
"""
End-to-end pipeline for LA City Council meeting audio.

Works from all_meetings.json (PrimeGov metadata) as the source of truth.
Downloads audio by meeting_id, processes with Gemini, updates manifest.

Usage:
    python pipeline.py --status                                  # Show pipeline status
    python pipeline.py --run --date-range 2026-03-01:2026-03-31  # Download + process March 2026
    python pipeline.py --run --committee "Transportation"        # Download + process all Transportation
    python pipeline.py --run --meeting-id 17900                  # Single meeting
    python pipeline.py --download --date-range 2026-01-01:2026-03-31  # Download audio only
    python pipeline.py --process                                 # Process all unprocessed audio
    python pipeline.py --housing-report                          # Show housing findings
    python pipeline.py --list                                    # List channel videos (legacy)

    # Batch API (Gemini 50% discount, 24h turnaround):
    python pipeline.py --batch-prepare --date-range 2025-01-01:2025-12-31
    python pipeline.py --batch-submit batches/batch_TIMESTAMP.json
    python pipeline.py --batch-status batches/batch_TIMESTAMP.json
    python pipeline.py --batch-retrieve batches/batch_TIMESTAMP.json

Directories:
    audio/        - Downloaded mp3 files (m{meeting_id}_{date}_{title}.mp3)
    transcripts/  - Gemini output (.json analysis + .txt transcript)
"""

import argparse
import json
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
AUDIO_DIR = PROJECT_DIR / "audio"
TRANSCRIPTS_DIR = PROJECT_DIR / "transcripts"
MEETINGS_FILE = PROJECT_DIR / "all_meetings.json"
MANIFEST_FILE = PROJECT_DIR / "manifest.json"

AUDIO_EXTENSIONS = frozenset({".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac", ".webm"})


# ---------------------------------------------------------------------------
# Meeting filtering
# ---------------------------------------------------------------------------

def load_meetings():
    """Load all meetings from all_meetings.json, flattened."""
    if not MEETINGS_FILE.exists():
        print(f"ERROR: {MEETINGS_FILE} not found. Run: python scrape_la_council.py")
        return []
    data = json.loads(MEETINGS_FILE.read_text())
    meetings = []
    for _year, mlist in data.items():
        meetings.extend(mlist)
    return meetings


def filter_meetings(meetings, date_range=None, committee=None, meeting_ids=None, require_video=True):
    """Filter meetings by criteria. Returns list of meeting dicts."""
    result = []
    for m in meetings:
        # Must have videoUrl
        if require_video and not m.get("videoUrl"):
            continue

        # Skip SAP/cancelled
        title = m.get("title", "")
        title_lower = title.lower()
        if "cancelled" in title_lower or "canceled" in title_lower:
            continue
        if "- SAP" in title or title.strip().endswith("SAP"):
            continue
        if not m.get("documentList"):
            continue

        # Filter by meeting IDs
        if meeting_ids is not None:
            if m["id"] not in meeting_ids:
                continue

        # Filter by date range
        if date_range:
            date = m["dateTime"][:10]
            start, end = date_range
            if date < start or date > end:
                continue

        # Filter by committee name (substring match, case-insensitive)
        if committee:
            if committee.lower() not in title_lower:
                continue

        result.append(m)

    # Deduplicate by meeting id
    seen = set()
    deduped = []
    for m in result:
        if m["id"] not in seen:
            seen.add(m["id"])
            deduped.append(m)

    return sorted(deduped, key=lambda m: m["dateTime"])


def parse_date_range(s):
    """Parse 'YYYY-MM-DD:YYYY-MM-DD' into (start, end) tuple."""
    if ":" not in s:
        # Single date = that whole day
        return (s, s)
    parts = s.split(":", 1)
    return (parts[0], parts[1])


# ---------------------------------------------------------------------------
# Status & reports
# ---------------------------------------------------------------------------

def show_status():
    """Show pipeline status from manifest."""
    if MANIFEST_FILE.exists():
        manifest = json.loads(MANIFEST_FILE.read_text())
        total = len(manifest)
        has_video = sum(1 for m in manifest.values() if m["video_id"])
        has_docs = sum(1 for m in manifest.values() if m["status"]["docs"])
        has_audio = sum(1 for m in manifest.values() if m["status"]["audio"])
        has_transcript = sum(1 for m in manifest.values() if m["status"]["transcript"])

        print(f"Manifest: {total} meetings")
        print(f"  With videoUrl:   {has_video} ({has_video/total*100:.0f}%)")
        print(f"  With docs:       {has_docs} ({has_docs/total*100:.0f}%)")
        print(f"  With audio:      {has_audio} ({has_audio/total*100:.0f}%)")
        print(f"  With transcript: {has_transcript} ({has_transcript/total*100:.0f}%)")
    else:
        print("No manifest.json found. Run: python build_manifest.py")

    # Also show raw file counts
    audio_files = []
    if AUDIO_DIR.exists():
        audio_files = [f for f in AUDIO_DIR.iterdir() if f.suffix.lower() in AUDIO_EXTENSIONS]

    transcript_files = []
    if TRANSCRIPTS_DIR.exists():
        transcript_files = [f for f in TRANSCRIPTS_DIR.iterdir() if f.suffix == ".json"]

    transcript_stems = {f.stem for f in transcript_files}
    unprocessed = [f for f in audio_files if f.stem not in transcript_stems]

    print(f"\nFiles on disk:")
    print(f"  Audio files:       {len(audio_files)}")
    print(f"  Transcripts:       {len(transcript_files)}")
    print(f"  Unprocessed audio: {len(unprocessed)}")

    if unprocessed:
        print("\n  Unprocessed:")
        for f in sorted(unprocessed)[:20]:
            size_mb = f.stat().st_size / (1024 * 1024)
            print(f"    {f.name} ({size_mb:.1f} MB)")
        if len(unprocessed) > 20:
            print(f"    ... and {len(unprocessed) - 20} more")


def housing_report():
    """Print housing-relevant items from all transcripts."""
    if not TRANSCRIPTS_DIR.exists():
        print("No transcripts directory found.")
        return

    transcript_files = sorted(TRANSCRIPTS_DIR.glob("*.json"))
    if not transcript_files:
        print("No transcripts found.")
        return

    total_items = 0
    housing_items = 0

    for tf in transcript_files:
        data = json.loads(tf.read_text())
        items = data.get("items_discussed", [])
        housing = [i for i in items if i.get("housing_relevant")]
        total_items += len(items)
        housing_items += len(housing)

        if housing:
            meeting_date = data.get("meeting_date", "unknown")
            meeting_type = data.get("meeting_type", "unknown")
            mid = data.get("meeting_id", "?")
            print(f"\n=== m{mid} | {meeting_date} - {meeting_type} ===")
            if data.get("housing_summary"):
                print(f"  Summary: {data['housing_summary']}")
            for item in housing:
                cf = item.get("council_file") or "no CF#"
                print(f"  [{cf}] {item['topic']}")
                print(f"    {item['summary']}")
                vote = item.get("vote", {})
                if vote.get("result") and vote["result"] != "No Vote":
                    print(f"    Vote: {vote['result']} (ayes={vote.get('ayes', '?')}, nays={vote.get('nays', '?')})")
                tags = item.get("housing_tags", [])
                if tags:
                    print(f"    Tags: {', '.join(tags)}")

    print(f"\n--- Total: {housing_items} housing items out of {total_items} items across {len(transcript_files)} meetings ---")


# ---------------------------------------------------------------------------
# Pipeline actions
# ---------------------------------------------------------------------------

def do_download(meetings, model=None):
    """Download audio for a list of meetings."""
    from download_audio import download_meetings

    print(f"{'=' * 60}")
    print(f"DOWNLOADING AUDIO: {len(meetings)} meetings")
    print("=" * 60)
    return download_meetings(meetings)


def do_process(model="gemini-2.5-flash"):
    """Process all unprocessed audio files synchronously."""
    from process_meeting import process_batch as sync_process

    print(f"\n{'=' * 60}")
    print("PROCESSING AUDIO WITH GEMINI")
    print("=" * 60)
    if AUDIO_DIR.exists():
        sync_process(AUDIO_DIR, TRANSCRIPTS_DIR, model=model)
    else:
        print("No audio directory found.")


def do_run(meetings, model="gemini-2.5-flash"):
    """Full pipeline: download audio then process."""
    do_download(meetings)
    do_process(model=model)

    # Rebuild manifest
    from build_manifest import build_manifest
    print(f"\n{'=' * 60}")
    print("REBUILDING MANIFEST")
    print("=" * 60)
    build_manifest()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="LA City Council audio pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    # Actions
    actions = parser.add_argument_group("actions")
    actions.add_argument("--run", action="store_true",
                         help="Full pipeline: download + process + rebuild manifest")
    actions.add_argument("--download", action="store_true",
                         help="Download audio only (no Gemini processing)")
    actions.add_argument("--process", action="store_true",
                         help="Process all unprocessed audio with Gemini")
    actions.add_argument("--status", action="store_true", help="Show pipeline status")
    actions.add_argument("--housing-report", action="store_true",
                         help="Show housing-relevant findings")
    actions.add_argument("--list", action="store_true",
                         help="List videos from YouTube channel (legacy)")
    actions.add_argument("--rebuild-manifest", action="store_true",
                         help="Rebuild manifest.json from filesystem")

    # Batch API
    batch_group = parser.add_argument_group("batch API (50% cost savings)")
    batch_group.add_argument("--batch-prepare", action="store_true",
                             help="Prepare batch: upload audio to Gemini, build batch request")
    batch_group.add_argument("--batch-submit", metavar="STATE_FILE",
                             help="Submit a prepared batch job")
    batch_group.add_argument("--batch-status", metavar="STATE_FILE",
                             help="Check status of a batch job")
    batch_group.add_argument("--batch-retrieve", metavar="STATE_FILE",
                             help="Retrieve results from a completed batch job")

    # Filters
    filters = parser.add_argument_group("filters")
    filters.add_argument("--date-range", type=str,
                         help="Date range: YYYY-MM-DD:YYYY-MM-DD")
    filters.add_argument("--committee", type=str,
                         help="Committee name filter (substring match)")
    filters.add_argument("--meeting-id", type=int, nargs="+",
                         help="Specific meeting ID(s)")

    # Options
    parser.add_argument("--model", default="gemini-2.5-flash",
                        help="Gemini model (default: gemini-2.5-flash)")
    parser.add_argument("--submit", action="store_true",
                        help="Auto-submit after --batch-prepare")

    args = parser.parse_args()

    # Route to action
    if args.status:
        show_status()
    elif args.housing_report:
        housing_report()
    elif args.list:
        from download_audio import list_videos
        list_videos(limit=30)
    elif args.rebuild_manifest:
        from build_manifest import build_manifest
        build_manifest()
    elif args.run or args.download:
        all_meetings = load_meetings()
        if not all_meetings:
            return

        date_range = parse_date_range(args.date_range) if args.date_range else None
        meeting_ids = set(args.meeting_id) if args.meeting_id else None
        meetings = filter_meetings(all_meetings, date_range=date_range,
                                   committee=args.committee, meeting_ids=meeting_ids)

        if not meetings:
            print("No meetings match the given filters.")
            return

        print(f"Matched {len(meetings)} meetings.")
        if args.run:
            do_run(meetings, model=args.model)
        else:
            do_download(meetings)
    elif args.process:
        do_process(model=args.model)
    elif args.batch_prepare:
        all_meetings = load_meetings()
        if not all_meetings:
            return
        date_range = parse_date_range(args.date_range) if args.date_range else None
        meeting_ids = set(args.meeting_id) if args.meeting_id else None
        meetings = filter_meetings(all_meetings, date_range=date_range,
                                   committee=args.committee, meeting_ids=meeting_ids)
        if not meetings:
            print("No meetings match the given filters.")
            return

        from batch_processing import prepare_batch, submit_batch
        state_file = prepare_batch(meetings, model=args.model)
        if args.submit and state_file:
            submit_batch(state_file)
    elif args.batch_submit:
        from batch_processing import submit_batch
        submit_batch(args.batch_submit)
    elif args.batch_status:
        from batch_processing import poll_batch
        poll_batch(args.batch_status)
    elif args.batch_retrieve:
        from batch_processing import retrieve_batch
        retrieve_batch(args.batch_retrieve)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
