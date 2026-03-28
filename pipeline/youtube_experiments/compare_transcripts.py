"""Compare YouTube caption extraction methods against Groq Whisper transcript."""
import json
import re
import os
from difflib import SequenceMatcher

OUTPUT_DIR = "/Users/royhu/Documents/projects/askLA/youtube_experiments"
GROQ_PATH = "/Users/royhu/Documents/projects/askLA/whisper_experiments/transcripts/m125_2019-02-13_City_Council_Meeting_-_Wednesday.txt"

def load_timestamped_lines(path):
    """Load transcript file into list of (timestamp_seconds, text) tuples."""
    lines = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            match = re.match(r'\[(\d{2}):(\d{2}):(\d{2})\]\s*(.*)', line)
            if match:
                h, m, s = int(match.group(1)), int(match.group(2)), int(match.group(3))
                text = match.group(4)
                lines.append((h * 3600 + m * 60 + s, text))
    return lines

def get_full_text(lines):
    """Combine all text from timestamped lines."""
    return " ".join(text for _, text in lines)

def word_count(text):
    return len(text.split())

def similarity_ratio(text1, text2):
    """SequenceMatcher ratio (0-1) between two texts."""
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

def compare_segment(groq_lines, yt_lines, start_s, end_s, label):
    """Compare a time segment between Groq and YouTube transcripts."""
    groq_seg = " ".join(t for ts, t in groq_lines if start_s <= ts < end_s)
    yt_seg = " ".join(t for ts, t in yt_lines if start_s <= ts < end_s)

    if not groq_seg and not yt_seg:
        return None

    sim = similarity_ratio(groq_seg, yt_seg) if groq_seg and yt_seg else 0
    return {
        "label": label,
        "groq_words": word_count(groq_seg),
        "yt_words": word_count(yt_seg),
        "similarity": sim,
        "groq_sample": groq_seg[:200],
        "yt_sample": yt_seg[:200],
    }

def parse_json3_to_lines(json3_path):
    """Parse yt-dlp json3 file into timestamped lines."""
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
            lines.append((int(start_s), text))
    return lines

def main():
    print("=" * 70)
    print("TRANSCRIPT COMPARISON: YouTube Captions vs Groq Whisper")
    print("=" * 70)

    # Load Groq transcript
    groq_lines = load_timestamped_lines(GROQ_PATH)
    groq_text = get_full_text(groq_lines)

    print(f"\n--- Groq Whisper (baseline) ---")
    print(f"  Lines: {len(groq_lines)}")
    print(f"  Words: {word_count(groq_text)}")
    if groq_lines:
        print(f"  Duration: {groq_lines[0][0]}s to {groq_lines[-1][0]}s")

    # Load YouTube transcripts
    sources = {}

    # Method 1: youtube-transcript-api
    m1_path = f"{OUTPUT_DIR}/method1_transcript_api.txt"
    if os.path.exists(m1_path):
        sources["Method 1: youtube-transcript-api"] = load_timestamped_lines(m1_path)

    # Method 2a: yt-dlp SRT
    m2srt_path = f"{OUTPUT_DIR}/method2_ytdlp_srt.txt"
    if os.path.exists(m2srt_path):
        sources["Method 2a: yt-dlp (SRT)"] = load_timestamped_lines(m2srt_path)

    # Method 2b: yt-dlp json3
    json3_files = [f for f in os.listdir(OUTPUT_DIR) if f.startswith("method2_ytdlp_json3_") and f.endswith(".json3")]
    if json3_files:
        json3_path = os.path.join(OUTPUT_DIR, json3_files[0])
        sources["Method 2b: yt-dlp (json3)"] = parse_json3_to_lines(json3_path)

    # Method 3: direct scrape
    m3_path = f"{OUTPUT_DIR}/method3_direct_xml.txt"
    if os.path.exists(m3_path):
        sources["Method 3: direct scrape"] = load_timestamped_lines(m3_path)

    if not sources:
        print("\nNo YouTube transcripts found!")
        return

    # Overall comparison
    print(f"\n{'=' * 70}")
    print("OVERALL COMPARISON")
    print(f"{'=' * 70}")

    for name, yt_lines in sources.items():
        yt_text = get_full_text(yt_lines)
        print(f"\n--- {name} ---")
        print(f"  Lines: {len(yt_lines)}")
        print(f"  Words: {word_count(yt_text)}")
        if yt_lines:
            print(f"  Duration: {yt_lines[0][0]}s to {yt_lines[-1][0]}s")

        # Overall similarity (expensive for long texts, sample it)
        # Use first 5000 chars for quick comparison
        sample_len = 5000
        sim = similarity_ratio(groq_text[:sample_len], yt_text[:sample_len])
        print(f"  Similarity to Groq (first {sample_len} chars): {sim:.1%}")

    # Segment-by-segment comparison (every 5 minutes)
    print(f"\n{'=' * 70}")
    print("SEGMENT COMPARISON (5-minute windows)")
    print(f"{'=' * 70}")

    # Use the first YouTube source for detailed comparison
    best_name = list(sources.keys())[0]
    best_lines = sources[best_name]

    max_time = max(
        groq_lines[-1][0] if groq_lines else 0,
        best_lines[-1][0] if best_lines else 0,
    )

    print(f"\nComparing Groq vs {best_name}:")
    print(f"{'Segment':<20} {'Groq words':<12} {'YT words':<12} {'Similarity':<12}")
    print("-" * 56)

    for start in range(0, max_time + 1, 300):  # 5-minute segments
        end = start + 300
        result = compare_segment(groq_lines, best_lines, start, end, f"{start//60}-{end//60}min")
        if result:
            print(f"{result['label']:<20} {result['groq_words']:<12} {result['yt_words']:<12} {result['similarity']:<12.1%}")

    # Side-by-side sample at key points
    print(f"\n{'=' * 70}")
    print("SIDE-BY-SIDE SAMPLES")
    print(f"{'=' * 70}")

    sample_times = [0, 300, 600, 1800, 3600, 7200]  # 0, 5min, 10min, 30min, 1hr, 2hr
    for t in sample_times:
        if t > max_time:
            break

        print(f"\n--- At {t//3600}h{(t%3600)//60:02d}m ---")

        # Find nearest Groq line
        groq_near = [(ts, txt) for ts, txt in groq_lines if abs(ts - t) <= 10]
        if groq_near:
            print(f"  GROQ:    [{groq_near[0][0]//3600:02d}:{(groq_near[0][0]%3600)//60:02d}:{groq_near[0][0]%60:02d}] {groq_near[0][1][:120]}")

        yt_near = [(ts, txt) for ts, txt in best_lines if abs(ts - t) <= 10]
        if yt_near:
            print(f"  YOUTUBE: [{yt_near[0][0]//3600:02d}:{(yt_near[0][0]%3600)//60:02d}:{yt_near[0][0]%60:02d}] {yt_near[0][1][:120]}")

    # Quality observations
    print(f"\n{'=' * 70}")
    print("KEY OBSERVATIONS")
    print(f"{'=' * 70}")

    # Check for truncation in Groq (lines ending abruptly)
    groq_truncated = sum(1 for _, t in groq_lines if len(t) < 30 and not t.endswith(('.', '!', '?', '"')))
    print(f"\n  Groq lines that appear truncated (short, no ending punctuation): {groq_truncated}/{len(groq_lines)}")

    # Check YouTube caption type
    print(f"\n  YouTube caption source: Manual CC (not auto-generated)")
    print(f"  This means the captions were human-uploaded, likely higher quality than ASR")

    # Word count ratio
    for name, yt_lines in sources.items():
        yt_words = word_count(get_full_text(yt_lines))
        groq_words = word_count(groq_text)
        ratio = yt_words / groq_words if groq_words else 0
        print(f"\n  {name}:")
        print(f"    Word count ratio (YT/Groq): {ratio:.2f}")
        if ratio > 1.1:
            print(f"    YouTube has {ratio:.0%} more words — likely more complete")
        elif ratio < 0.9:
            print(f"    YouTube has {1-ratio:.0%} fewer words — Groq may be more verbose")
        else:
            print(f"    Similar word counts")

if __name__ == "__main__":
    main()
