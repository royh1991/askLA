"""Method 2: yt-dlp subtitle extraction"""
import subprocess
import json
import glob
import os
import re

VIDEO_ID = "K30xYEKTDVk"
VIDEO_URL = f"https://youtube.com/watch?v={VIDEO_ID}"
OUTPUT_DIR = "/Users/royhu/Documents/projects/askLA/youtube_experiments"

def list_subs():
    """List available subtitles."""
    result = subprocess.run(
        ["yt-dlp", "--list-subs", VIDEO_URL],
        capture_output=True, text=True
    )
    print("Available subtitles:")
    print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)

def download_auto_subs_json3():
    """Download auto-generated subs in json3 format (most granular)."""
    subprocess.run([
        "yt-dlp",
        "--write-auto-subs",
        "--sub-langs", "en",
        "--sub-format", "json3",
        "--skip-download",
        "-o", f"{OUTPUT_DIR}/method2_ytdlp_%(id)s.%(ext)s",
        VIDEO_URL
    ], capture_output=True, text=True)

def download_auto_subs_srt():
    """Download auto-generated subs in SRT format."""
    subprocess.run([
        "yt-dlp",
        "--write-auto-subs",
        "--sub-langs", "en",
        "--sub-format", "srt",
        "--skip-download",
        "-o", f"{OUTPUT_DIR}/method2_ytdlp_srt_%(id)s.%(ext)s",
        VIDEO_URL
    ], capture_output=True, text=True)

def download_manual_subs():
    """Download manual (human-uploaded) subs if available."""
    result = subprocess.run([
        "yt-dlp",
        "--write-subs",
        "--sub-langs", "en",
        "--sub-format", "srt",
        "--skip-download",
        "-o", f"{OUTPUT_DIR}/method2_ytdlp_manual_%(id)s.%(ext)s",
        VIDEO_URL
    ], capture_output=True, text=True)
    print("Manual subs stderr:", result.stderr[-500:] if result.stderr else "(none)")

def parse_json3_to_text(json3_path):
    """Parse json3 subtitle file into timestamped text."""
    with open(json3_path) as f:
        data = json.load(f)

    lines = []
    for event in data.get("events", []):
        start_ms = event.get("tStartMs", 0)
        segs = event.get("segs", [])
        text = "".join(s.get("utf8", "") for s in segs).strip()
        if text and text != "\n":
            start_s = start_ms / 1000
            hours = int(start_s // 3600)
            minutes = int((start_s % 3600) // 60)
            seconds = int(start_s % 60)
            lines.append(f"[{hours:02d}:{minutes:02d}:{seconds:02d}] {text}")

    return lines

def parse_srt_to_text(srt_path):
    """Parse SRT subtitle file into timestamped text."""
    with open(srt_path) as f:
        content = f.read()

    lines = []
    blocks = content.strip().split("\n\n")
    for block in blocks:
        parts = block.strip().split("\n")
        if len(parts) >= 3:
            # Parse timestamp line: "00:00:00,000 --> 00:00:05,000"
            time_match = re.match(r"(\d{2}):(\d{2}):(\d{2}),\d+", parts[1])
            if time_match:
                h, m, s = int(time_match.group(1)), int(time_match.group(2)), int(time_match.group(3))
                text = " ".join(parts[2:]).strip()
                # Remove HTML tags (yt-dlp sometimes includes them)
                text = re.sub(r"<[^>]+>", "", text)
                if text:
                    lines.append(f"[{h:02d}:{m:02d}:{s:02d}] {text}")

    return lines

def main():
    print("=== Method 2: yt-dlp subtitle extraction ===\n")

    list_subs()

    print("\n--- Downloading auto-generated subs (json3) ---")
    download_auto_subs_json3()

    print("\n--- Downloading auto-generated subs (srt) ---")
    download_auto_subs_srt()

    print("\n--- Downloading manual subs ---")
    download_manual_subs()

    # Find and parse json3 files
    json3_files = glob.glob(f"{OUTPUT_DIR}/method2_ytdlp_*.json3")
    if json3_files:
        print(f"\nFound json3 file: {json3_files[0]}")
        lines = parse_json3_to_text(json3_files[0])
        output_path = f"{OUTPUT_DIR}/method2_ytdlp_json3.txt"
        with open(output_path, "w") as f:
            f.write("\n".join(lines))
        print(f"Saved {len(lines)} lines to {output_path}")
        print("\nFirst 10 lines:")
        for line in lines[:10]:
            print(f"  {line}")
    else:
        print("No json3 files found")

    # Find and parse SRT files
    srt_files = glob.glob(f"{OUTPUT_DIR}/method2_ytdlp_srt_*.srt")
    if srt_files:
        print(f"\nFound SRT file: {srt_files[0]}")
        lines = parse_srt_to_text(srt_files[0])
        output_path = f"{OUTPUT_DIR}/method2_ytdlp_srt.txt"
        with open(output_path, "w") as f:
            f.write("\n".join(lines))
        print(f"Saved {len(lines)} lines to {output_path}")
    else:
        print("No SRT files found")

if __name__ == "__main__":
    main()
