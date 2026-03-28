#!/usr/bin/env python3
"""
Fetch YouTube captions via yt-dlp with built-in rate limiting.

More robust than youtube-transcript-api because yt-dlp:
- Uses curl_cffi for Chrome TLS fingerprinting (--impersonate chrome)
- Has built-in --sleep-subtitles to throttle subtitle requests
- Supports cookies natively
- Has deno JS challenge solving

Usage:
    # Fetch all meetings 2023+ (default, conservative speed ~2-3/min)
    python youtube_experiments/yt_captions/fetch_captions_ytdlp.py

    # Faster (moderate ban risk, ~6-10/min)
    python youtube_experiments/yt_captions/fetch_captions_ytdlp.py --fast

    # Specific years
    python youtube_experiments/yt_captions/fetch_captions_ytdlp.py --years 2025 2026

    # Single meeting
    python youtube_experiments/yt_captions/fetch_captions_ytdlp.py --meeting-id 17900

    # Dry run
    python youtube_experiments/yt_captions/fetch_captions_ytdlp.py --dry-run

    # Show stats
    python youtube_experiments/yt_captions/fetch_captions_ytdlp.py --stats

Output: same format as fetch_captions.py
    youtube_experiments/yt_captions/transcripts/m{id}_{date}_{title}.txt
    youtube_experiments/yt_captions/transcripts/m{id}_{date}_{title}.meta.json

Cost: FREE. Speed: ~2-3 videos/min (safe) or ~6-10/min (fast).
Requires: yt-dlp, deno (brew install deno)
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "transcripts"
PROGRESS_FILE = SCRIPT_DIR / "progress.json"
ALL_MEETINGS_PATH = PROJECT_DIR / "all_meetings.json"
COOKIES_PATH = PROJECT_DIR / ".yt-cookies.txt"

DEFAULT_YEARS = ["2023", "2024", "2025", "2026"]


def sanitize_title(title):
    title = re.sub(r'[^\w\s-]', '', title)
    title = re.sub(r'\s+', '_', title.strip())
    return title


def extract_video_id(video_url):
    if not video_url:
        return None
    match = re.search(r'[?&]v=([A-Za-z0-9_-]{11})', video_url)
    return match.group(1) if match else None


def load_meetings(years=None, meeting_id=None):
    with open(ALL_MEETINGS_PATH) as f:
        all_meetings = json.load(f)

    meetings = []
    years_to_check = years or DEFAULT_YEARS

    for year in years_to_check:
        for m in all_meetings.get(year, []):
            video_url = m.get("videoUrl") or ""
            video_id = extract_video_id(video_url)
            if not video_id:
                continue
            mid = m.get("id")
            if meeting_id is not None and mid != meeting_id:
                continue
            dt_str = m.get("dateTime", "")
            meetings.append({
                "meeting_id": mid,
                "video_id": video_id,
                "video_url": video_url,
                "date": dt_str[:10] if dt_str else "",
                "title": m.get("title", "Unknown"),
                "year": year,
            })

    return meetings


def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return set(json.load(f))
    return set()


def save_progress(completed):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(sorted(completed), f)


def output_paths(meeting):
    mid = meeting["meeting_id"]
    date = meeting["date"]
    title = sanitize_title(meeting["title"])
    stem = f"m{mid}_{date}_{title}"
    return OUTPUT_DIR / f"{stem}.txt", OUTPUT_DIR / f"{stem}.meta.json"


def parse_json3(json3_path):
    """Parse yt-dlp json3 subtitle file into timestamped lines."""
    with open(json3_path) as f:
        data = json.load(f)

    entries = []
    for event in data.get("events", []):
        start_ms = event.get("tStartMs", 0)
        dur_ms = event.get("dDurationMs", 0)
        segs = event.get("segs", [])
        text = "".join(s.get("utf8", "") for s in segs).strip()
        if text and text != "\n":
            entries.append({
                "start": start_ms / 1000,
                "duration": dur_ms / 1000,
                "text": text,
            })
    return entries


def parse_srt(srt_path):
    """Parse SRT subtitle file into timestamped lines."""
    with open(srt_path) as f:
        content = f.read()

    entries = []
    blocks = content.strip().split("\n\n")
    for block in blocks:
        parts = block.strip().split("\n")
        if len(parts) >= 3:
            time_match = re.match(r"(\d{2}):(\d{2}):(\d{2}),(\d+)\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d+)", parts[1])
            if time_match:
                h, m, s, ms = int(time_match.group(1)), int(time_match.group(2)), int(time_match.group(3)), int(time_match.group(4))
                h2, m2, s2, ms2 = int(time_match.group(5)), int(time_match.group(6)), int(time_match.group(7)), int(time_match.group(8))
                start = h * 3600 + m * 60 + s + ms / 1000
                end = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000
                text = " ".join(parts[2:]).strip()
                text = re.sub(r"<[^>]+>", "", text)
                if text:
                    entries.append({
                        "start": start,
                        "duration": end - start,
                        "text": text,
                    })
    return entries


def parse_vtt(vtt_path):
    """Parse VTT subtitle file into timestamped lines."""
    with open(vtt_path) as f:
        content = f.read()

    entries = []
    blocks = content.strip().split("\n\n")
    for block in blocks:
        parts = block.strip().split("\n")
        for i, part in enumerate(parts):
            time_match = re.match(r"(\d{2}):(\d{2}):(\d{2})\.(\d+)\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d+)", part)
            if time_match:
                h, m, s, ms = int(time_match.group(1)), int(time_match.group(2)), int(time_match.group(3)), int(time_match.group(4))
                h2, m2, s2, ms2 = int(time_match.group(5)), int(time_match.group(6)), int(time_match.group(7)), int(time_match.group(8))
                start = h * 3600 + m * 60 + s + ms / 1000
                end = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000
                text_lines = parts[i + 1:]
                text = " ".join(l.strip() for l in text_lines if l.strip())
                text = re.sub(r"<[^>]+>", "", text)
                if text:
                    entries.append({
                        "start": start,
                        "duration": end - start,
                        "text": text,
                    })
                break
    return entries


def fetch_single_ytdlp(meeting, sleep_subs=5, sleep_requests=0.75):
    """Fetch captions for one meeting via yt-dlp. Returns (meeting_id, success, info)."""
    mid = meeting["meeting_id"]
    vid = meeting["video_id"]
    txt_path, meta_path = output_paths(meeting)

    with tempfile.TemporaryDirectory() as tmpdir:
        out_template = os.path.join(tmpdir, f"{vid}.%(ext)s")

        cmd = [
            "yt-dlp",
            "--skip-download",
            "--write-subs",
            "--write-auto-subs",
            "--sub-langs", "en",
            "--sub-format", "json3/srt/vtt/best",
            "--impersonate", "chrome",
            "--sleep-subtitles", str(sleep_subs),
            "--sleep-requests", str(sleep_requests),
            "--no-warnings",
            "--quiet",
            "-o", out_template,
            meeting["video_url"],
        ]

        # Add cookies if available
        if COOKIES_PATH.exists():
            cmd.insert(-1, "--cookies")
            cmd.insert(-1, str(COOKIES_PATH))

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        except subprocess.TimeoutExpired:
            return mid, False, "timeout"

        if result.returncode != 0:
            stderr = result.stderr.strip()
            if "429" in stderr:
                return mid, False, "rate_limited (429)"
            if "no subtitles" in stderr.lower() or "has no subtitles" in stderr.lower():
                return mid, False, "no subtitles"
            return mid, False, f"yt-dlp error: {stderr[:80]}"

        # Find downloaded subtitle file
        sub_files = list(Path(tmpdir).glob(f"{vid}.*"))
        sub_files = [f for f in sub_files if f.suffix in ('.json3', '.srt', '.vtt')]

        if not sub_files:
            # yt-dlp succeeded but no sub file — might have no subs
            return mid, False, "no subtitle file produced"

        sub_file = sub_files[0]
        fmt = sub_file.suffix[1:]  # json3, srt, or vtt

        # Determine if manual or auto-generated
        # yt-dlp names auto subs differently (e.g., .en.json3 vs .en-orig.json3)
        filename = sub_file.name
        is_manual = not any(x in filename for x in ["-orig", ".auto."])
        # Also check: if --write-subs found manual subs, it takes priority
        caption_type = "manual_cc" if is_manual else "auto_generated"

        # Parse subtitle file
        try:
            if fmt == "json3":
                entries = parse_json3(sub_file)
            elif fmt == "srt":
                entries = parse_srt(sub_file)
            elif fmt == "vtt":
                entries = parse_vtt(sub_file)
            else:
                return mid, False, f"unknown format: {fmt}"
        except Exception as e:
            return mid, False, f"parse error: {str(e)[:60]}"

        if not entries:
            return mid, False, "empty subtitle file"

        # Write transcript (matching Groq format)
        with open(txt_path, "w") as f:
            for e in entries:
                total_s = e["start"]
                h = int(total_s // 3600)
                m = int((total_s % 3600) // 60)
                s = int(total_s % 60)
                f.write(f"[{h:02d}:{m:02d}:{s:02d}] {e['text']}\n")

        # Write metadata
        total_words = sum(len(e["text"].split()) for e in entries)
        last_end = entries[-1]["start"] + entries[-1]["duration"]
        meta = {
            "meeting_id": mid,
            "video_id": vid,
            "video_url": meeting["video_url"],
            "date": meeting["date"],
            "title": meeting["title"],
            "caption_type": caption_type,
            "caption_format": fmt,
            "segments": len(entries),
            "total_words": total_words,
            "duration_seconds": round(last_end, 1),
            "fetched_at": datetime.now().isoformat(),
            "method": "yt-dlp",
        }
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

        return mid, True, f"{caption_type}, {len(entries)} segments, {total_words} words"


def show_stats():
    meta_files = list(OUTPUT_DIR.glob("*.meta.json"))
    if not meta_files:
        print("No transcripts fetched yet.")
        return

    manual = auto = 0
    total_words = total_segments = 0
    total_duration = 0
    by_year = {}
    by_method = {}

    for mf in meta_files:
        with open(mf) as f:
            meta = json.load(f)
        ct = meta.get("caption_type", "unknown")
        if ct == "manual_cc":
            manual += 1
        else:
            auto += 1
        total_words += meta.get("total_words", 0)
        total_segments += meta.get("segments", 0)
        total_duration += meta.get("duration_seconds", 0)

        year = meta.get("date", "")[:4] or "unknown"
        by_year.setdefault(year, {"manual": 0, "auto": 0, "count": 0})
        by_year[year]["count"] += 1
        if ct == "manual_cc":
            by_year[year]["manual"] += 1
        else:
            by_year[year]["auto"] += 1

        method = meta.get("method", "youtube-transcript-api")
        by_method[method] = by_method.get(method, 0) + 1

    print(f"YouTube Captions Stats")
    print(f"=" * 50)
    print(f"Total transcripts: {len(meta_files)}")
    print(f"  Manual CC:      {manual} ({manual/len(meta_files)*100:.0f}%)")
    print(f"  Auto-generated: {auto} ({auto/len(meta_files)*100:.0f}%)")
    print(f"Total words:      {total_words:,}")
    print(f"Total duration:   {total_duration/3600:.1f} hours")

    print(f"\nBy method:")
    for method, count in sorted(by_method.items()):
        print(f"  {method}: {count}")

    print(f"\nBy year:")
    print(f"  {'Year':<6} {'Count':<8} {'Manual':<8} {'Auto':<8} {'Manual%':<8}")
    print(f"  {'-'*38}")
    for year in sorted(by_year.keys()):
        y = by_year[year]
        pct = f"{y['manual']/y['count']*100:.0f}%" if y["count"] else "N/A"
        print(f"  {year:<6} {y['count']:<8} {y['manual']:<8} {y['auto']:<8} {pct:<8}")


def main():
    parser = argparse.ArgumentParser(description="Fetch YouTube captions via yt-dlp")
    parser.add_argument("--years", nargs="+", default=DEFAULT_YEARS)
    parser.add_argument("--meeting-id", type=int)
    parser.add_argument("--fast", action="store_true", help="Faster but higher ban risk")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--stats", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.stats:
        show_stats()
        return

    # Rate limiting settings
    if args.fast:
        sleep_subs = 2
        sleep_requests = 0.5
        label = "fast (2s sub delay)"
    else:
        sleep_subs = 5
        sleep_requests = 0.75
        label = "safe (5s sub delay)"

    meetings = load_meetings(years=args.years, meeting_id=args.meeting_id)
    print(f"Found {len(meetings)} meetings with YouTube URLs")

    completed = load_progress()
    if not args.force:
        pending = [m for m in meetings if m["meeting_id"] not in completed]
        print(f"Already completed: {len(meetings) - len(pending)}, pending: {len(pending)}")
    else:
        pending = meetings

    if not pending:
        print("Nothing to do.")
        return

    if args.dry_run:
        print(f"\nWould fetch {len(pending)} meetings ({label}):")
        for m in pending[:20]:
            print(f"  m{m['meeting_id']} {m['date']} {m['title'][:50]}")
        if len(pending) > 20:
            print(f"  ... and {len(pending) - 20} more")
        est_minutes = len(pending) * (sleep_subs + sleep_requests + 2) / 60
        print(f"\nEstimated time: {est_minutes:.0f} minutes ({est_minutes/60:.1f} hours)")
        return

    print(f"\nFetching captions via yt-dlp ({label})...")
    success_count = fail_count = 0
    consecutive_fails = 0
    start_time = time.time()

    for i, meeting in enumerate(pending, 1):
        mid, success, info = fetch_single_ytdlp(meeting, sleep_subs, sleep_requests)

        if success:
            success_count += 1
            consecutive_fails = 0
            completed.add(mid)
            if success_count % 50 == 0:
                save_progress(completed)
        else:
            fail_count += 1
            if "429" in info or "rate_limit" in info:
                consecutive_fails += 1
            else:
                consecutive_fails = 0

        elapsed = time.time() - start_time
        rate = i / elapsed if elapsed > 0 else 0
        remaining = len(pending) - i
        eta = remaining / rate if rate > 0 else 0
        status = "OK" if success else "FAIL"
        print(f"  [{i}/{len(pending)}] {status} m{mid} {meeting['date']} {meeting['title'][:35]:<35} {info[:50]}  (ETA {eta/60:.0f}m)")

        # Back off on consecutive rate limits
        if consecutive_fails >= 3:
            cooldown = 120 * (2 ** min(consecutive_fails // 3, 3))
            print(f"    -> {consecutive_fails} consecutive 429s, cooling down {cooldown}s...")
            time.sleep(cooldown)

    save_progress(completed)

    elapsed = time.time() - start_time
    print(f"\nDone in {elapsed/60:.1f} minutes")
    print(f"  Success: {success_count}")
    print(f"  Failed:  {fail_count}")
    print(f"  Total completed (all time): {len(completed)}")


if __name__ == "__main__":
    main()
