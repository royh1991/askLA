#!/usr/bin/env python3
"""
Download audio from LA City Council meeting videos on YouTube.

Optimized for bulk downloads: uses aria2c for multi-connection downloads,
parallel processes for concurrent videos, and exported browser cookies
for reliable YouTube access.

Usage:
    python download_audio.py list                          # List recent videos from LACityClerk
    python download_audio.py list --limit 50               # List more videos
    python download_audio.py download VIDEO_ID             # Download one video's audio
    python download_audio.py download VIDEO_ID1 VIDEO_ID2  # Download multiple

Output:
    audio/
    ├── m17900_2026-03-11_Transportation_Committee.mp3
    └── ...

Audio files are named: m{meeting_id}_{date}_{title}.mp3

Prerequisites:
    pip install yt-dlp
    brew install aria2 deno   # optional but recommended for speed
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
AUDIO_DIR = PROJECT_DIR / "audio"
PROGRESS_FILE = PROJECT_DIR / "audio_progress.json"
COOKIE_FILE = PROJECT_DIR / ".yt-cookies.txt"

CHANNEL_URL = "https://www.youtube.com/@LACityClerk/videos"

# Parallel download settings
# P=3 gives best per-video speed; P=4 gives best throughput for large batches
DEFAULT_WORKERS = 4

# yt-dlp base options
YTDLP_BASE_OPTS = [
    "-x",                          # extract audio only
    "--audio-format", "mp3",       # convert to mp3
    "--audio-quality", "5",        # ~128kbps, good enough for speech
    "--no-playlist",               # don't expand playlists by accident
    "--no-overwrites",             # skip if file already exists
    "--restrict-filenames",        # safe filenames
    "--remote-components", "ejs:github",  # JS challenge solver for YouTube
]


def _check_deps():
    """Check for required and optional dependencies."""
    try:
        subprocess.run(["yt-dlp", "--version"], capture_output=True, check=True)
    except FileNotFoundError:
        print("ERROR: yt-dlp is not installed. Run: pip install yt-dlp")
        sys.exit(1)

    has_aria2c = shutil.which("aria2c") is not None
    has_deno = shutil.which("deno") is not None

    if not has_deno:
        print("WARNING: deno not installed. YouTube JS challenges may fail.")
        print("  Install with: brew install deno")

    return has_aria2c


def _get_ytdlp_opts():
    """Build yt-dlp options including aria2c if available."""
    opts = list(YTDLP_BASE_OPTS)

    has_aria2c = shutil.which("aria2c") is not None
    if has_aria2c:
        opts.extend([
            "--downloader", "aria2c",
            "--downloader-args", "aria2c:-x 16 -k 1M",
        ])

    # Use cookie file if it exists, otherwise try browser cookies
    if COOKIE_FILE.exists():
        opts.extend(["--cookies", str(COOKIE_FILE)])
    else:
        opts.extend(["--cookies-from-browser", "chrome"])

    return opts


def export_cookies():
    """Export browser cookies to a file for parallel-safe downloads.

    Multiple yt-dlp processes can't all read from Chrome's cookie DB
    simultaneously, so we export once and share the file.
    """
    print("Exporting browser cookies for YouTube...")
    cmd = [
        "yt-dlp",
        "--remote-components", "ejs:github",
        "--cookies-from-browser", "chrome",
        "--cookies", str(COOKIE_FILE),
        "--skip-download",
        "https://youtube.com/watch?v=dQw4w9WgXcQ",  # any valid video
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if COOKIE_FILE.exists() and COOKIE_FILE.stat().st_size > 100:
        print(f"  Cookies exported to {COOKIE_FILE}")
        return True
    else:
        print(f"  WARNING: Cookie export may have failed. Downloads might require --cookies-from-browser.")
        return False


def _load_progress():
    """Load set of already-downloaded meeting IDs (or legacy video IDs)."""
    if PROGRESS_FILE.exists():
        return set(json.loads(PROGRESS_FILE.read_text()))
    return set()


def _save_progress(downloaded):
    """Save set of downloaded IDs."""
    PROGRESS_FILE.write_text(json.dumps(sorted(downloaded)))


def _sanitize(name, max_len=120):
    """Make a string safe for filenames."""
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    name = re.sub(r'\s+', '_', name)
    name = re.sub(r'_+', '_', name)
    return name.strip('_.')[: max_len]


def extract_video_id(url):
    """Extract YouTube video ID from a URL or return the string if already an ID."""
    if not url:
        return None
    match = re.search(r'(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})', url)
    if match:
        return match.group(1)
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
    return None


def meeting_audio_filename(meeting):
    """Generate the canonical audio filename for a meeting dict."""
    mid = meeting["id"]
    date = meeting["dateTime"][:10]
    title = _sanitize(meeting["title"])
    return f"m{mid}_{date}_{title}.mp3"


# ---------------------------------------------------------------------------
# Single video download
# ---------------------------------------------------------------------------

def _download_single_video(video_id, output_path):
    """Download a single video's audio. Called by workers.

    Args:
        video_id: YouTube video ID
        output_path: full path for the output mp3 file

    Returns:
        (success: bool, video_id: str, output_path: str, error: str|None)
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Download to temp, then rename
    temp_path = output_path.parent / f"_tmp_{video_id}.%(ext)s"
    url = f"https://www.youtube.com/watch?v={video_id}"

    cmd = ["yt-dlp"] + _get_ytdlp_opts() + ["-o", str(temp_path), url]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

    if result.returncode != 0:
        # Clean up any partial temp files
        for f in output_path.parent.glob(f"_tmp_{video_id}*"):
            f.unlink(missing_ok=True)
        error = result.stderr[:500] if result.stderr else "Unknown error"
        return (False, video_id, str(output_path), error)

    # Find and rename temp file
    temp_mp3 = output_path.parent / f"_tmp_{video_id}.mp3"
    if not temp_mp3.exists():
        for f in output_path.parent.iterdir():
            if f.name.startswith("_tmp_") and video_id in f.name and f.suffix == ".mp3":
                temp_mp3 = f
                break

    if temp_mp3.exists():
        temp_mp3.rename(output_path)
        return (True, video_id, str(output_path), None)

    return (False, video_id, str(output_path), "Could not locate downloaded file")


# ---------------------------------------------------------------------------
# List videos
# ---------------------------------------------------------------------------

def list_videos(limit=30, search_query=None):
    """List videos from the LACityClerk YouTube channel."""
    _check_deps()

    if search_query:
        url = f"https://www.youtube.com/@LACityClerk/search?query={search_query}"
    else:
        url = CHANNEL_URL

    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--print", "%(id)s\t%(title)s\t%(upload_date)s\t%(duration_string)s",
        "--playlist-end", str(limit),
        url,
    ]

    print(f"Fetching video list (limit={limit})...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR: {result.stderr}")
        return []

    videos = []
    for line in result.stdout.strip().split("\n"):
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) >= 3:
            vid = {
                "id": parts[0],
                "title": parts[1],
                "upload_date": parts[2] if parts[2] != "NA" else "unknown",
                "duration": parts[3] if len(parts) > 3 and parts[3] != "NA" else "unknown",
            }
            videos.append(vid)

    listing_file = PROJECT_DIR / "video_listing.json"
    listing_file.write_text(json.dumps(videos, indent=2))

    for v in videos:
        print(f"  {v['upload_date']}  {v['duration']:>10s}  {v['id']}  {v['title']}")

    print(f"\n{len(videos)} videos found. Listing saved to {listing_file}")
    return videos


# ---------------------------------------------------------------------------
# Legacy single download (backward compat)
# ---------------------------------------------------------------------------

def download_one(video_id, audio_dir=None):
    """Download audio for a single video by video ID. Returns the output filepath or None."""
    _check_deps()

    if audio_dir is None:
        audio_dir = AUDIO_DIR
    audio_dir = Path(audio_dir)
    audio_dir.mkdir(parents=True, exist_ok=True)

    output_path = audio_dir / f"{video_id}.mp3"
    ok, _, path, error = _download_single_video(video_id, output_path)
    if ok:
        size_mb = Path(path).stat().st_size / (1024 * 1024)
        print(f"  OK: {Path(path).name} ({size_mb:.1f} MB)")
        return path
    else:
        print(f"  ERROR: {error}")
        return None


# ---------------------------------------------------------------------------
# Meeting-based download (single)
# ---------------------------------------------------------------------------

def download_by_meeting(meeting, audio_dir=None):
    """Download audio for a meeting using its videoUrl.

    Returns path to the downloaded mp3, or None on failure.
    """
    video_url = meeting.get("videoUrl")
    if not video_url:
        return None

    video_id = extract_video_id(video_url)
    if not video_id:
        return None

    if audio_dir is None:
        audio_dir = AUDIO_DIR
    audio_dir = Path(audio_dir)

    target_path = audio_dir / meeting_audio_filename(meeting)
    if target_path.exists():
        return str(target_path)

    ok, _, path, error = _download_single_video(video_id, target_path)
    if ok:
        size_mb = Path(path).stat().st_size / (1024 * 1024)
        print(f"  OK m{meeting['id']}: {Path(path).name} ({size_mb:.1f} MB)")
        return path
    else:
        print(f"  ERR m{meeting['id']}: {error[:200] if error else 'unknown'}")
        return None


# ---------------------------------------------------------------------------
# Parallel meeting downloads (the fast path)
# ---------------------------------------------------------------------------

def download_meetings(meetings, audio_dir=None, workers=DEFAULT_WORKERS):
    """Download audio for multiple meetings in parallel.

    Uses ProcessPoolExecutor to run N downloads concurrently.
    Each worker uses aria2c for multi-connection downloads.

    Args:
        meetings: list of meeting dicts from all_meetings.json
        audio_dir: output directory (default: audio/)
        workers: number of parallel downloads (default: 4)

    Returns:
        list of result dicts with meeting_id and file path
    """
    _check_deps()

    if audio_dir is None:
        audio_dir = AUDIO_DIR
    audio_dir = Path(audio_dir)
    audio_dir.mkdir(parents=True, exist_ok=True)

    # Ensure cookies are exported for parallel-safe access
    if not COOKIE_FILE.exists():
        export_cookies()

    downloaded = _load_progress()

    # Build work items: (video_id, target_path, meeting)
    work = []
    for meeting in meetings:
        mid = str(meeting["id"])
        if mid in downloaded:
            continue

        video_url = meeting.get("videoUrl")
        if not video_url:
            continue

        video_id = extract_video_id(video_url)
        if not video_id:
            continue

        target_path = audio_dir / meeting_audio_filename(meeting)
        if target_path.exists():
            downloaded.add(mid)
            _save_progress(downloaded)
            continue

        work.append((video_id, str(target_path), meeting))

    if not work:
        print("  All meetings already downloaded.")
        return []

    print(f"Downloading {len(work)} meetings ({workers} parallel workers)...")

    results = []
    ok = err = 0

    with ProcessPoolExecutor(max_workers=workers) as pool:
        futures = {}
        for video_id, target_path, meeting in work:
            future = pool.submit(_download_single_video, video_id, target_path)
            futures[future] = meeting

        for future in as_completed(futures):
            meeting = futures[future]
            mid = str(meeting["id"])
            try:
                success, vid, path, error = future.result()
                if success:
                    ok += 1
                    downloaded.add(mid)
                    size_mb = Path(path).stat().st_size / (1024 * 1024)
                    print(f"  OK  m{mid} {meeting['title'][:50]} ({size_mb:.1f} MB)")
                    results.append({"meeting_id": meeting["id"], "file": path})
                else:
                    err += 1
                    print(f"  ERR m{mid} {meeting['title'][:50]}: {error[:150] if error else '?'}")
            except Exception as e:
                err += 1
                print(f"  ERR m{mid}: {e}")

            # Save progress periodically
            if (ok + err) % 5 == 0:
                _save_progress(downloaded)

    _save_progress(downloaded)
    print(f"\nDone: {ok} downloaded, {err} errors")
    return results


# ---------------------------------------------------------------------------
# Legacy bulk download by video ID
# ---------------------------------------------------------------------------

def download_many(video_ids, audio_dir=None):
    """Download audio for multiple videos by ID/URL. Legacy interface."""
    _check_deps()

    if audio_dir is None:
        audio_dir = AUDIO_DIR
    audio_dir = Path(audio_dir)
    audio_dir.mkdir(parents=True, exist_ok=True)

    if not COOKIE_FILE.exists():
        export_cookies()

    downloaded = _load_progress()
    results = []

    for vid in video_ids:
        vid = vid.strip()
        if not vid or vid.startswith("#"):
            continue

        extracted = extract_video_id(vid)
        if extracted:
            vid = extracted

        if vid in downloaded:
            print(f"  Skipping {vid} (already downloaded)")
            continue

        output_path = audio_dir / f"{vid}.mp3"
        ok, _, path, error = _download_single_video(vid, output_path)
        if ok:
            downloaded.add(vid)
            _save_progress(downloaded)
            size_mb = Path(path).stat().st_size / (1024 * 1024)
            print(f"  OK: {Path(path).name} ({size_mb:.1f} MB)")
            results.append({"video_id": vid, "file": path})
        else:
            print(f"  ERROR {vid}: {error[:200] if error else '?'}")

    print(f"\nDownloaded {len(results)} files.")
    return results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Download LA City Council meeting audio")
    subparsers = parser.add_subparsers(dest="command")

    list_parser = subparsers.add_parser("list", help="List videos from LACityClerk channel")
    list_parser.add_argument("--limit", type=int, default=30, help="Number of videos to list")
    list_parser.add_argument("--search", type=str, help="Search query")

    dl_parser = subparsers.add_parser("download", help="Download audio for specific video(s)")
    dl_parser.add_argument("video_ids", nargs="+", help="YouTube video IDs or URLs")

    batch_parser = subparsers.add_parser("batch", help="Download from a file of URLs/IDs")
    batch_parser.add_argument("file", help="Text file with one URL or video ID per line")

    export_parser = subparsers.add_parser("export-cookies",
                                          help="Export browser cookies for parallel downloads")

    args = parser.parse_args()

    if args.command == "list":
        list_videos(limit=args.limit, search_query=args.search)
    elif args.command == "download":
        download_many(args.video_ids)
    elif args.command == "batch":
        with open(args.file) as f:
            ids = [line.strip() for line in f if line.strip()]
        download_many(ids)
    elif args.command == "export-cookies":
        export_cookies()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
