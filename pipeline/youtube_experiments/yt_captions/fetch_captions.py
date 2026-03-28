#!/usr/bin/env python3
"""
Fetch YouTube captions for LA City Council meetings via youtube-transcript-api.

Downloads captions (manual CC when available, auto-generated otherwise) and saves
them linked by PrimeGov meeting.id — the universal key connecting agendas, videos,
and transcripts.

Usage:
    # Fetch all meetings 2023+ (default)
    python youtube_experiments/yt_captions/fetch_captions.py

    # Specific year range
    python youtube_experiments/yt_captions/fetch_captions.py --years 2024 2025 2026

    # Single meeting
    python youtube_experiments/yt_captions/fetch_captions.py --meeting-id 17900

    # Custom delay between requests (default 1s)
    python youtube_experiments/yt_captions/fetch_captions.py --delay 2.0

    # Dry run (list what would be fetched)
    python youtube_experiments/yt_captions/fetch_captions.py --dry-run

    # Show stats only
    python youtube_experiments/yt_captions/fetch_captions.py --stats

Output:
    youtube_experiments/yt_captions/transcripts/m{id}_{date}_{title}.txt
    youtube_experiments/yt_captions/transcripts/m{id}_{date}_{title}.meta.json
    youtube_experiments/yt_captions/progress.json

Cost: FREE (no API key required).
Speed: ~0.5-1 second per video.

Requires: pip install youtube-transcript-api
"""

import argparse
import json
import random
import re
import sys
import time
from datetime import datetime
from pathlib import Path

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "transcripts"
PROGRESS_FILE = SCRIPT_DIR / "progress.json"
ALL_MEETINGS_PATH = PROJECT_DIR / "all_meetings.json"

# Years to fetch by default
DEFAULT_YEARS = ["2023", "2024", "2025", "2026"]

# Webshare rotating residential proxy — rotate across 10 sticky endpoints.
# Each -N suffix maps to a different residential IP.
# Rotating across them avoids burning out any single IP.
PROXY_ENDPOINTS = 10
PROXY_TEMPLATE = "http://zljybfsw-US-{n}:79gkuxonvhre@p.webshare.io:80"

# Rate limiting — with rotating proxy, ban risk is low but be polite
REQUEST_DELAY = 1.0       # seconds between requests
MAX_RETRIES = 2           # retries on transient errors (keep low to avoid long stalls)
BACKOFF_BASE = 10         # base backoff seconds (doubles each retry)
BATCH_SIZE = 100          # pause after this many requests
BATCH_PAUSE = 10          # seconds to pause between batches


def sanitize_title(title):
    """Sanitize title for use in filename, matching existing convention."""
    title = re.sub(r'[^\w\s-]', '', title)
    title = re.sub(r'\s+', '_', title.strip())
    return title


def extract_video_id(video_url):
    """Extract YouTube video ID from URL."""
    if not video_url:
        return None
    match = re.search(r'[?&]v=([A-Za-z0-9_-]{11})', video_url)
    return match.group(1) if match else None


def load_meetings(years=None, meeting_id=None):
    """Load meetings from all_meetings.json, filtered by year and videoUrl."""
    with open(ALL_MEETINGS_PATH) as f:
        all_meetings = json.load(f)

    meetings = []
    years_to_check = years or DEFAULT_YEARS

    for year in years_to_check:
        year_meetings = all_meetings.get(year, [])
        for m in year_meetings:
            video_url = m.get("videoUrl") or ""
            video_id = extract_video_id(video_url)
            if not video_id:
                continue

            mid = m.get("id")
            if meeting_id is not None and mid != meeting_id:
                continue

            dt_str = m.get("dateTime", "")
            date = dt_str[:10] if dt_str else ""
            title = m.get("title", "Unknown")

            meetings.append({
                "meeting_id": mid,
                "video_id": video_id,
                "video_url": video_url,
                "date": date,
                "title": title,
                "year": year,
                "committee_id": m.get("committeeId"),
            })

    # Also check upcoming
    if meeting_id is not None:
        for m in all_meetings.get("upcoming", []):
            if m.get("id") == meeting_id:
                video_url = m.get("videoUrl") or ""
                video_id = extract_video_id(video_url)
                if video_id:
                    dt_str = m.get("dateTime", "")
                    meetings.append({
                        "meeting_id": m["id"],
                        "video_id": video_id,
                        "video_url": video_url,
                        "date": dt_str[:10] if dt_str else "",
                        "title": m.get("title", "Unknown"),
                        "year": "upcoming",
                        "committee_id": m.get("committeeId"),
                    })

    return meetings


def load_progress():
    """Load set of already-completed meeting IDs."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return set(json.load(f))
    return set()


def save_progress(completed):
    """Save set of completed meeting IDs."""
    with open(PROGRESS_FILE, "w") as f:
        json.dump(sorted(completed), f)


def output_path_for_meeting(meeting):
    """Generate output file path for a meeting."""
    mid = meeting["meeting_id"]
    date = meeting["date"]
    title = sanitize_title(meeting["title"])
    stem = f"m{mid}_{date}_{title}"
    return OUTPUT_DIR / f"{stem}.txt", OUTPUT_DIR / f"{stem}.meta.json"


def is_rate_limit_error(error_msg):
    """Check if the error looks like a rate limit / bot detection."""
    indicators = ["too many requests", "429", "ip", "blocked", "bot", "captcha"]
    lower = error_msg.lower()
    return any(ind in lower for ind in indicators)


def fetch_single(meeting):
    """Fetch captions for a single meeting with retry on rate limits.

    Returns (meeting_id, success, info, was_rate_limited).
    """
    mid = meeting["meeting_id"]
    vid = meeting["video_id"]
    txt_path, meta_path = output_path_for_meeting(meeting)

    last_error = ""
    for attempt in range(MAX_RETRIES + 1):
        try:
            # Rotate proxy endpoint: use a different sticky IP each attempt
            # Also rotate based on meeting_id to spread load
            n = ((mid + attempt) % PROXY_ENDPOINTS) + 1
            proxy_url = PROXY_TEMPLATE.format(n=n)
            proxy_config = GenericProxyConfig(
                http_url=proxy_url, https_url=proxy_url,
            )
            import requests as _requests
            session = _requests.Session()
            session.timeout = 20  # 20s timeout to avoid hangs
            ytt_api = YouTubeTranscriptApi(proxy_config=proxy_config, http_client=session)

            # List available transcripts to determine type
            transcript_list = ytt_api.list(vid)
            has_manual = False
            caption_lang = None
            for t in transcript_list:
                if not t.is_generated:
                    has_manual = True
                    caption_lang = t.language_code
                    break
            if not has_manual:
                for t in transcript_list:
                    if t.language_code.startswith("en"):
                        caption_lang = t.language_code
                        break
                if not caption_lang and len(list(transcript_list)) > 0:
                    caption_lang = list(transcript_list)[0].language_code

            caption_type = "manual_cc" if has_manual else "auto_generated"

            # Fetch the transcript
            if has_manual:
                transcript = ytt_api.fetch(vid, languages=[caption_lang])
            else:
                transcript = ytt_api.fetch(vid, languages=["en"])

            # Build entries
            entries = []
            for snippet in transcript:
                entries.append({
                    "start": snippet.start,
                    "duration": snippet.duration,
                    "text": snippet.text,
                })

            if not entries:
                return mid, False, "empty transcript", False

            # Write transcript text file (matching Groq format)
            with open(txt_path, "w") as f:
                for e in entries:
                    total_s = e["start"]
                    h = int(total_s // 3600)
                    m = int((total_s % 3600) // 60)
                    s = int(total_s % 60)
                    f.write(f"[{h:02d}:{m:02d}:{s:02d}] {e['text']}\n")

            # Write metadata
            meta = {
                "meeting_id": mid,
                "video_id": vid,
                "video_url": meeting["video_url"],
                "date": meeting["date"],
                "title": meeting["title"],
                "caption_type": caption_type,
                "caption_language": caption_lang,
                "segments": len(entries),
                "total_words": sum(len(e["text"].split()) for e in entries),
                "duration_seconds": round(entries[-1]["start"] + entries[-1]["duration"], 1),
                "fetched_at": datetime.now().isoformat(),
            }
            with open(meta_path, "w") as f:
                json.dump(meta, f, indent=2)

            return mid, True, f"{caption_type}, {len(entries)} segments, {meta['total_words']} words", False

        except Exception as e:
            last_error = str(e)

            # Don't retry on permanent errors (no captions, disabled)
            lower = last_error.lower()
            if "disabled" in lower:
                return mid, False, "captions disabled", False
            if "no transcripts" in lower or "could not retrieve" in lower:
                # Could be a genuine "no captions" or a proxy IP that's banned.
                # Retry twice on different proxy endpoints to rule out IP ban.
                if attempt < 2:
                    time.sleep(2)
                    continue
                return mid, False, "no transcripts available", False

            # Retry on anything else (likely rate limit)
            if attempt < MAX_RETRIES:
                backoff = BACKOFF_BASE * (2 ** attempt) + random.uniform(0, 10)
                print(f"    -> Retry {attempt+1}/{MAX_RETRIES} for m{mid} in {backoff:.0f}s ({last_error[:60]})")
                time.sleep(backoff)
                continue

    return mid, False, f"error after {MAX_RETRIES} retries: {last_error[:80]}", True


def main():
    parser = argparse.ArgumentParser(description="Fetch YouTube captions for LA City Council meetings")
    parser.add_argument("--years", nargs="+", default=DEFAULT_YEARS, help="Years to fetch (default: 2023-2026)")
    parser.add_argument("--meeting-id", type=int, help="Fetch a single meeting by ID")
    parser.add_argument("--delay", type=float, default=2.0, help="Delay between requests in seconds (default: 2.0)")
    parser.add_argument("--dry-run", action="store_true", help="List what would be fetched without fetching")
    parser.add_argument("--stats", action="store_true", help="Show stats from already-fetched transcripts")
    parser.add_argument("--force", action="store_true", help="Re-fetch even if already completed")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Stats mode
    if args.stats:
        show_stats()
        return

    # Load meetings
    meetings = load_meetings(
        years=args.years,
        meeting_id=args.meeting_id,
    )
    print(f"Found {len(meetings)} meetings with YouTube URLs for years {', '.join(args.years)}")

    # Filter already completed
    completed = load_progress()
    if not args.force:
        pending = [m for m in meetings if m["meeting_id"] not in completed]
        print(f"Already completed: {len(meetings) - len(pending)}, pending: {len(pending)}")
    else:
        pending = meetings
        print(f"Force mode: re-fetching all {len(pending)}")

    if not pending:
        print("Nothing to do.")
        return

    # Dry run
    if args.dry_run:
        print(f"\nWould fetch {len(pending)} meetings:")
        for m in pending[:20]:
            print(f"  m{m['meeting_id']} {m['date']} {m['title'][:50]}")
        if len(pending) > 20:
            print(f"  ... and {len(pending) - 20} more")
        return

    # Fetch — sequential with throttling to avoid YouTube rate limits
    delay = args.delay
    print(f"\nFetching captions sequentially ({delay}s delay between requests)...")
    success_count = 0
    fail_count = 0
    manual_count = 0
    auto_count = 0
    consecutive_fails = 0
    start_time = time.time()

    for i, meeting in enumerate(pending, 1):
        mid, success, info, was_rate_limited = fetch_single(meeting)

        if success:
            success_count += 1
            consecutive_fails = 0
            completed.add(mid)
            if "manual_cc" in info:
                manual_count += 1
            else:
                auto_count += 1

            # Save progress every 50
            if success_count % 50 == 0:
                save_progress(completed)
        else:
            fail_count += 1
            # Track permanent failures (no captions / disabled) so we don't retry them
            if not was_rate_limited:
                completed.add(mid)
            else:
                consecutive_fails += 1

        # Progress line
        elapsed = time.time() - start_time
        rate = i / elapsed if elapsed > 0 else 0
        eta = (len(pending) - i) / rate if rate > 0 else 0
        status = "OK" if success else "FAIL"
        print(f"  [{i}/{len(pending)}] {status} m{mid} {meeting['date']} {meeting['title'][:35]:<35} {info[:50]}  ({rate:.1f}/s, ETA {eta/60:.0f}m)")

        # Adaptive delay: back off more if we're getting rate-limited
        if consecutive_fails >= 3:
            cooldown = 120 * (2 ** min(consecutive_fails // 3, 3))  # 120s, 240s, 480s, 960s
            print(f"    -> {consecutive_fails} consecutive fails, cooling down {cooldown}s ({cooldown//60}min)...")
            time.sleep(cooldown)
            consecutive_fails = 0
        elif i < len(pending):
            # Batch pause: rest every BATCH_SIZE requests
            if i % BATCH_SIZE == 0:
                print(f"    -> Batch pause ({BATCH_PAUSE}s after {BATCH_SIZE} requests)...")
                time.sleep(BATCH_PAUSE)
            else:
                # Add jitter to avoid predictable patterns
                jittered_delay = delay + random.uniform(0, delay * 0.5)
                time.sleep(jittered_delay)

    # Final save
    save_progress(completed)

    elapsed = time.time() - start_time
    print(f"\nDone in {elapsed:.1f}s")
    print(f"  Success: {success_count} (manual CC: {manual_count}, auto-generated: {auto_count})")
    print(f"  Failed:  {fail_count}")
    print(f"  Total completed (all time): {len(completed)}")


def show_stats():
    """Show stats from already-fetched transcripts."""
    meta_files = list(OUTPUT_DIR.glob("*.meta.json"))
    if not meta_files:
        print("No transcripts fetched yet.")
        return

    manual = 0
    auto = 0
    total_words = 0
    total_segments = 0
    total_duration = 0
    by_year = {}

    for mf in meta_files:
        with open(mf) as f:
            meta = json.load(f)
        if meta.get("caption_type") == "manual_cc":
            manual += 1
        else:
            auto += 1
        total_words += meta.get("total_words", 0)
        total_segments += meta.get("segments", 0)
        total_duration += meta.get("duration_seconds", 0)

        date = meta.get("date", "")
        year = date[:4] if date else "unknown"
        by_year[year] = by_year.get(year, {"manual": 0, "auto": 0, "count": 0})
        by_year[year]["count"] += 1
        if meta.get("caption_type") == "manual_cc":
            by_year[year]["manual"] += 1
        else:
            by_year[year]["auto"] += 1

    print(f"YouTube Captions Stats")
    print(f"=" * 50)
    print(f"Total transcripts: {len(meta_files)}")
    print(f"  Manual CC:      {manual} ({manual/len(meta_files)*100:.0f}%)")
    print(f"  Auto-generated: {auto} ({auto/len(meta_files)*100:.0f}%)")
    print(f"Total words:      {total_words:,}")
    print(f"Total segments:   {total_segments:,}")
    print(f"Total duration:   {total_duration/3600:.1f} hours")
    print(f"Avg words/meeting: {total_words//len(meta_files):,}")

    print(f"\nBy year:")
    print(f"  {'Year':<6} {'Count':<8} {'Manual':<8} {'Auto':<8} {'Manual%':<8}")
    print(f"  {'-'*38}")
    for year in sorted(by_year.keys()):
        y = by_year[year]
        pct = f"{y['manual']/y['count']*100:.0f}%" if y["count"] else "N/A"
        print(f"  {year:<6} {y['count']:<8} {y['manual']:<8} {y['auto']:<8} {pct:<8}")


if __name__ == "__main__":
    main()
