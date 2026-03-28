"""Method 3: Direct timedtext API scraping (no library dependencies beyond requests)"""
import json
import re
import xml.etree.ElementTree as ET
import requests

VIDEO_ID = "K30xYEKTDVk"
OUTPUT_DIR = "/Users/royhu/Documents/projects/askLA/youtube_experiments"

def get_caption_tracks(video_id):
    """Scrape the video page for caption track URLs."""
    url = f"https://www.youtube.com/watch?v={video_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    # Extract captionTracks from ytInitialPlayerResponse
    match = re.search(r'"captionTracks":(\[.*?\])', response.text)
    if not match:
        print("No captionTracks found in page source")
        # Try alternative pattern
        match = re.search(r'"captions":\s*\{.*?"captionTracks":\s*(\[.*?\])', response.text)
        if not match:
            print("No captions found at all")
            return []

    tracks = json.loads(match.group(1))
    return tracks

def download_transcript_xml(base_url):
    """Download transcript in XML format (default timedtext format)."""
    response = requests.get(base_url)
    response.raise_for_status()
    return response.text

def download_transcript_json3(base_url):
    """Download transcript in json3 format."""
    url = base_url + "&fmt=json3"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def parse_xml_transcript(xml_text):
    """Parse XML timedtext format into timestamped lines."""
    root = ET.fromstring(xml_text)
    lines = []
    for text_elem in root.findall(".//text"):
        start = float(text_elem.get("start", 0))
        dur = float(text_elem.get("dur", 0))
        content = text_elem.text or ""
        content = content.replace("&#39;", "'").replace("&amp;", "&").replace("&quot;", '"')
        if content.strip():
            hours = int(start // 3600)
            minutes = int((start % 3600) // 60)
            seconds = int(start % 60)
            lines.append(f"[{hours:02d}:{minutes:02d}:{seconds:02d}] {content.strip()}")
    return lines

def parse_json3_transcript(data):
    """Parse json3 format into timestamped lines."""
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

def main():
    print("=== Method 3: Direct timedtext API scraping ===\n")

    tracks = get_caption_tracks(VIDEO_ID)
    if not tracks:
        print("FAILED: Could not find caption tracks")
        return

    print(f"Found {len(tracks)} caption track(s):")
    for t in tracks:
        lang = t.get("languageCode", "?")
        kind = t.get("kind", "manual")
        name = t.get("name", {})
        if isinstance(name, dict):
            name = name.get("simpleText", "")
        print(f"  Language: {lang}, Kind: {kind}, Name: {name}")

    # Use the first English track
    en_tracks = [t for t in tracks if t.get("languageCode") == "en"]
    track = en_tracks[0] if en_tracks else tracks[0]
    base_url = track["baseUrl"]

    # Method 3a: XML format
    print("\n--- Downloading XML format ---")
    try:
        xml_text = download_transcript_xml(base_url)
        lines = parse_xml_transcript(xml_text)
        output_path = f"{OUTPUT_DIR}/method3_direct_xml.txt"
        with open(output_path, "w") as f:
            f.write("\n".join(lines))
        print(f"Saved {len(lines)} lines to {output_path}")
        print("\nFirst 10 lines:")
        for line in lines[:10]:
            print(f"  {line}")
    except Exception as e:
        print(f"XML download failed: {e}")

    # Method 3b: json3 format
    print("\n--- Downloading json3 format ---")
    try:
        data = download_transcript_json3(base_url)
        lines = parse_json3_transcript(data)
        output_path = f"{OUTPUT_DIR}/method3_direct_json3.txt"
        with open(output_path, "w") as f:
            f.write("\n".join(lines))
        # Also save raw json
        with open(f"{OUTPUT_DIR}/method3_direct.json3", "w") as f:
            json.dump(data, f, indent=2)
        print(f"Saved {len(lines)} lines to {output_path}")
    except Exception as e:
        print(f"json3 download failed: {e}")

if __name__ == "__main__":
    main()
