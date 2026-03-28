#!/usr/bin/env python3
"""
Build manifest.json — the universal index linking meetings to their artifacts.

Maps each PrimeGov meeting_id to its agenda docs, audio file, and transcript files.

Usage:
    python build_manifest.py           # Full rebuild
    python build_manifest.py --stats   # Print summary statistics

Output:
    manifest.json — keyed by meeting_id, with paths to all associated files.
"""

import argparse
import json
import re
from pathlib import Path

from download_audio import _sanitize, extract_video_id

PROJECT_DIR = Path(__file__).resolve().parent
MEETINGS_FILE = PROJECT_DIR / "all_meetings.json"
DOCS_DIR = PROJECT_DIR / "docs"
AUDIO_DIR = PROJECT_DIR / "audio"
TRANSCRIPTS_DIR = PROJECT_DIR / "transcripts"
MANIFEST_FILE = PROJECT_DIR / "manifest.json"

# Same skip logic as scrape_la_council.py
SKIP_TEMPLATES = frozenset({
    "HTML Recess Notice", "Recess Notice",
    "HTML Notice of Cancellation", "Notice of Cancellation",
    "HTML SAP Video",
})

DOWNLOAD_TEMPLATES = frozenset({
    "HTML Agenda", "Agenda",
    "HTML Special Agenda", "Special Agenda",
    "HTML Continuation Agenda", "Continuation Agenda",
    "HTML Revised Agenda", "Revised Agenda",
    "HTML Journal", "Journal",
    "Presented Motions and Resolutions",
    "Special Meeting Journal",
})


def _is_skip_meeting(meeting):
    """Return True for meetings we should skip (same logic as scrape_la_council.py)."""
    title_lower = meeting["title"].lower()
    if "cancelled" in title_lower or "canceled" in title_lower:
        return True
    if "- SAP" in meeting["title"] or meeting["title"].strip().endswith("SAP"):
        return True
    docs = meeting.get("documentList", [])
    if not docs:
        return True
    if all(d["templateName"] in SKIP_TEMPLATES for d in docs):
        return True
    return False


def _expected_doc_paths(meeting):
    """Return list of expected doc file paths for a meeting (relative to PROJECT_DIR)."""
    meeting_date = meeting["dateTime"][:10]
    date_folder = meeting_date.replace("-", "")
    safe_title = _sanitize(meeting["title"], max_len=150)

    html_by_tid = {}
    pdf_by_tid = {}
    for doc in meeting.get("documentList", []):
        tname = doc["templateName"]
        if tname not in DOWNLOAD_TEMPLATES:
            continue
        tid = doc["templateId"]
        otype = doc["compileOutputType"]
        if otype == 3:
            html_by_tid[tid] = doc
        elif otype == 1:
            pdf_by_tid[tid] = doc

    chosen = list(html_by_tid.values())
    for tid, doc in pdf_by_tid.items():
        if tid not in html_by_tid:
            chosen.append(doc)

    paths = []
    for doc in chosen:
        otype = doc["compileOutputType"]
        ext = "html" if otype == 3 else "pdf"
        safe_tpl = _sanitize(doc["templateName"], max_len=150)
        filename = f"{meeting_date}_{safe_title}_{safe_tpl}.{ext}"
        rel_path = f"docs/{date_folder}/{filename}"
        paths.append(rel_path)

    return paths


def _canonical_stem(meeting):
    """Return the canonical filename stem for a meeting: m{id}_{date}_{title}."""
    mid = meeting["id"]
    date = meeting["dateTime"][:10]
    title = _sanitize(meeting["title"])
    return f"m{mid}_{date}_{title}"


def build_manifest():
    """Build the full manifest from all_meetings.json + filesystem scan."""
    if not MEETINGS_FILE.exists():
        print(f"ERROR: {MEETINGS_FILE} not found. Run scrape_la_council.py first.")
        return None

    all_meetings = json.loads(MEETINGS_FILE.read_text())

    # Build index of actual files on disk for quick lookup
    audio_files = {}  # stem -> path
    if AUDIO_DIR.exists():
        for f in AUDIO_DIR.iterdir():
            if f.suffix == ".mp3":
                audio_files[f.stem] = str(f.relative_to(PROJECT_DIR))

    transcript_jsons = {}  # stem -> path
    transcript_txts = {}   # stem -> path
    if TRANSCRIPTS_DIR.exists():
        for f in TRANSCRIPTS_DIR.iterdir():
            if f.suffix == ".json":
                transcript_jsons[f.stem] = str(f.relative_to(PROJECT_DIR))
            elif f.suffix == ".txt":
                transcript_txts[f.stem] = str(f.relative_to(PROJECT_DIR))

    manifest = {}
    for _year_key, meetings in all_meetings.items():
        for meeting in meetings:
            if _is_skip_meeting(meeting):
                continue

            mid = str(meeting["id"])
            date = meeting["dateTime"][:10]
            video_url = meeting.get("videoUrl") or ""
            video_id = extract_video_id(video_url)
            stem = _canonical_stem(meeting)

            # Find doc paths (check which actually exist on disk)
            expected_docs = _expected_doc_paths(meeting)
            existing_docs = [p for p in expected_docs if (PROJECT_DIR / p).exists()]

            # Find audio (check canonical name first, then scan for video_id match)
            audio_path = None
            if stem in audio_files:
                audio_path = audio_files[stem]
            elif video_id:
                for astem, apath in audio_files.items():
                    if video_id in astem:
                        audio_path = apath
                        break

            # Find transcripts (check canonical name first, then scan for video_id match)
            tj_path = None
            tt_path = None
            if stem in transcript_jsons:
                tj_path = transcript_jsons[stem]
            elif video_id:
                for tstem, tpath in transcript_jsons.items():
                    if video_id in tstem:
                        tj_path = tpath
                        break
            if stem in transcript_txts:
                tt_path = transcript_txts[stem]
            elif video_id:
                for tstem, tpath in transcript_txts.items():
                    if video_id in tstem:
                        tt_path = tpath
                        break

            manifest[mid] = {
                "meeting_id": meeting["id"],
                "title": meeting["title"],
                "date": date,
                "dateTime": meeting["dateTime"],
                "committeeId": meeting.get("committeeId"),
                "videoUrl": video_url or None,
                "video_id": video_id,
                "doc_paths": existing_docs,
                "audio_path": audio_path,
                "transcript_json": tj_path,
                "transcript_txt": tt_path,
                "status": {
                    "docs": len(existing_docs) > 0,
                    "audio": audio_path is not None,
                    "transcript": tj_path is not None,
                },
            }

    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2))
    print(f"Manifest saved: {MANIFEST_FILE}")
    print(f"  Total meetings: {len(manifest)}")
    return manifest


def print_stats(manifest=None):
    """Print summary statistics from the manifest."""
    if manifest is None:
        if not MANIFEST_FILE.exists():
            print("No manifest.json found. Run build_manifest.py first.")
            return
        manifest = json.loads(MANIFEST_FILE.read_text())

    total = len(manifest)
    has_video = sum(1 for m in manifest.values() if m["video_id"])
    has_docs = sum(1 for m in manifest.values() if m["status"]["docs"])
    has_audio = sum(1 for m in manifest.values() if m["status"]["audio"])
    has_transcript = sum(1 for m in manifest.values() if m["status"]["transcript"])
    has_all = sum(1 for m in manifest.values()
                  if m["status"]["docs"] and m["status"]["audio"] and m["status"]["transcript"])

    print(f"Manifest statistics:")
    print(f"  Total meetings:    {total}")
    print(f"  With videoUrl:     {has_video} ({has_video/total*100:.0f}%)")
    print(f"  With docs:         {has_docs} ({has_docs/total*100:.0f}%)")
    print(f"  With audio:        {has_audio} ({has_audio/total*100:.0f}%)")
    print(f"  With transcript:   {has_transcript} ({has_transcript/total*100:.0f}%)")
    print(f"  Complete (all 3):  {has_all}")


def main():
    parser = argparse.ArgumentParser(description="Build manifest.json linking all meeting artifacts")
    parser.add_argument("--stats", action="store_true", help="Print statistics from existing manifest")
    args = parser.parse_args()

    if args.stats:
        print_stats()
    else:
        manifest = build_manifest()
        if manifest:
            print_stats(manifest)


if __name__ == "__main__":
    main()
