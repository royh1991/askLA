"""Compare YouTube caption methods (correct video e1hxtQRUGyo) vs Groq Whisper for m125."""
import json
import re
import os
from difflib import SequenceMatcher

OUTPUT_DIR = "/Users/royhu/Documents/projects/askLA/youtube_experiments"
GROQ_PATH = "/Users/royhu/Documents/projects/askLA/whisper_experiments/transcripts/m125_2019-02-13_City_Council_Meeting_-_Wednesday.txt"

def load_timestamped_lines(path):
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

def parse_srt(path):
    with open(path) as f:
        content = f.read()
    lines = []
    blocks = content.strip().split("\n\n")
    for block in blocks:
        parts = block.strip().split("\n")
        if len(parts) >= 3:
            time_match = re.match(r"(\d{2}):(\d{2}):(\d{2}),\d+", parts[1])
            if time_match:
                h, m, s = int(time_match.group(1)), int(time_match.group(2)), int(time_match.group(3))
                text = " ".join(parts[2:]).strip()
                text = re.sub(r"<[^>]+>", "", text)
                if text:
                    lines.append((h * 3600 + m * 60 + s, text))
    return lines

def parse_json3(path):
    with open(path) as f:
        data = json.load(f)
    lines = []
    for event in data.get("events", []):
        start_ms = event.get("tStartMs", 0)
        segs = event.get("segs", [])
        text = "".join(s.get("utf8", "") for s in segs).strip()
        if text and text != "\n":
            start_s = start_ms / 1000
            lines.append((int(start_s), text))
    return lines

def get_text(lines):
    return " ".join(t for _, t in lines)

def word_count(text):
    return len(text.split())

def similarity_ratio(t1, t2):
    return SequenceMatcher(None, t1.lower(), t2.lower()).ratio()

def segment_text(lines, start, end):
    return " ".join(t for ts, t in lines if start <= ts < end)

def main():
    print("=" * 70)
    print("TRANSCRIPT COMPARISON: Correct Video (e1hxtQRUGyo) = Meeting m125")
    print("=" * 70)

    # Load sources
    groq = load_timestamped_lines(GROQ_PATH)
    groq_text = get_text(groq)

    sources = {}

    # Method 1: youtube-transcript-api
    m1 = f"{OUTPUT_DIR}/method1_correct_video.txt"
    if os.path.exists(m1):
        sources["youtube-transcript-api"] = load_timestamped_lines(m1)

    # Method 2a: yt-dlp SRT
    srt = f"{OUTPUT_DIR}/correct_ytdlp_e1hxtQRUGyo.en.srt"
    if os.path.exists(srt):
        sources["yt-dlp (SRT)"] = parse_srt(srt)

    # Method 2b: yt-dlp json3
    j3 = f"{OUTPUT_DIR}/correct_ytdlp_json3_e1hxtQRUGyo.en.json3"
    if os.path.exists(j3):
        sources["yt-dlp (json3)"] = parse_json3(j3)

    # Overview
    print(f"\n{'Source':<28} {'Lines':<8} {'Words':<8} {'Duration':<12}")
    print("-" * 56)
    print(f"{'Groq Whisper':<28} {len(groq):<8} {word_count(groq_text):<8} {groq[-1][0]//60}min")
    for name, lines in sources.items():
        text = get_text(lines)
        dur = f"{lines[-1][0]//60}min" if lines else "0"
        print(f"{name:<28} {len(lines):<8} {word_count(text):<8} {dur}")

    # Overall similarity
    print(f"\n{'=' * 70}")
    print("SIMILARITY TO GROQ WHISPER")
    print(f"{'=' * 70}")

    for name, lines in sources.items():
        text = get_text(lines)
        # Sample multiple sections for average similarity
        sims = []
        for chunk_start in range(0, min(len(groq_text), len(text), 30000), 2000):
            chunk_end = chunk_start + 2000
            g_chunk = groq_text[chunk_start:chunk_end]
            t_chunk = text[chunk_start:chunk_end]
            if g_chunk and t_chunk:
                sims.append(similarity_ratio(g_chunk, t_chunk))
        avg_sim = sum(sims) / len(sims) if sims else 0
        print(f"\n  {name}:")
        print(f"    Avg similarity (2KB chunks): {avg_sim:.1%}")
        print(f"    Word ratio (YT/Groq): {word_count(text)/word_count(groq_text):.2f}")

    # Segment comparison (every 10 minutes)
    print(f"\n{'=' * 70}")
    print("SEGMENT COMPARISON (10-min windows)")
    print(f"{'=' * 70}")

    best_name = list(sources.keys())[0]
    best = sources[best_name]
    max_time = max(groq[-1][0], best[-1][0]) if groq and best else 0

    print(f"\nGroq vs {best_name}:")
    print(f"{'Segment':<15} {'Groq wds':<10} {'YT wds':<10} {'Similarity':<12}")
    print("-" * 47)

    for start in range(0, max_time + 1, 600):
        end = start + 600
        g_seg = segment_text(groq, start, end)
        yt_seg = segment_text(best, start, end)
        if not g_seg and not yt_seg:
            continue
        sim = similarity_ratio(g_seg, yt_seg) if g_seg and yt_seg else 0
        label = f"{start//60}-{end//60}min"
        print(f"{label:<15} {word_count(g_seg):<10} {word_count(yt_seg):<10} {sim:<12.1%}")

    # Side-by-side at key timestamps
    print(f"\n{'=' * 70}")
    print("SIDE-BY-SIDE SAMPLES")
    print(f"{'=' * 70}")

    sample_times = [0, 60, 300, 600, 1200, 1800, 3600, 5400, 7200]
    for t in sample_times:
        if t > max_time:
            break

        g_near = [txt for ts, txt in groq if abs(ts - t) <= 5]
        yt_near = [txt for ts, txt in best if abs(ts - t) <= 5]

        if g_near or yt_near:
            mins = t // 60
            secs = t % 60
            print(f"\n--- At {mins}m{secs:02d}s ---")
            if g_near:
                print(f"  GROQ:    {g_near[0][:120]}")
            else:
                print(f"  GROQ:    (no text)")
            if yt_near:
                print(f"  YOUTUBE: {yt_near[0][:120]}")
            else:
                print(f"  YOUTUBE: (no text)")

    # Quality analysis
    print(f"\n{'=' * 70}")
    print("QUALITY ANALYSIS")
    print(f"{'=' * 70}")

    # Groq truncation
    truncated = sum(1 for _, t in groq if len(t) < 30 and not t.endswith(('.', '!', '?', '"', ')')))
    print(f"\n  Groq truncated lines: {truncated}/{len(groq)} ({truncated/len(groq)*100:.1f}%)")

    # Capitalization (proxy for quality)
    yt_text = get_text(best)
    groq_caps = sum(1 for c in groq_text if c.isupper())
    yt_caps = sum(1 for c in yt_text if c.isupper())
    print(f"  Groq uppercase chars: {groq_caps} ({groq_caps/len(groq_text)*100:.1f}%)")
    print(f"  YouTube uppercase chars: {yt_caps} ({yt_caps/len(yt_text)*100:.1f}%)")

    # Punctuation (proxy for readability)
    groq_punct = sum(1 for c in groq_text if c in '.!?,;:')
    yt_punct = sum(1 for c in yt_text if c in '.!?,;:')
    print(f"  Groq punctuation marks: {groq_punct}")
    print(f"  YouTube punctuation marks: {yt_punct}")

    # Coverage: how much of the video does each cover?
    groq_coverage = groq[-1][0] if groq else 0
    yt_coverage = best[-1][0] if best else 0
    print(f"\n  Groq covers: {groq_coverage//60}min ({groq_coverage/3600:.1f}h)")
    print(f"  YouTube covers: {yt_coverage//60}min ({yt_coverage/3600:.1f}h)")

    if yt_coverage > groq_coverage:
        gap = yt_coverage - groq_coverage
        print(f"  YouTube has {gap//60}min MORE coverage (Groq audio was likely shorter/trimmed)")
    elif groq_coverage > yt_coverage:
        gap = groq_coverage - yt_coverage
        print(f"  Groq has {gap//60}min MORE coverage")

    # Summary
    print(f"\n{'=' * 70}")
    print("SUMMARY")
    print(f"{'=' * 70}")
    print("""
  Caption type: Auto-generated (YouTube ASR)

  Key differences vs Groq Whisper:
  1. CAPITALIZATION: YouTube auto-captions are all lowercase.
     Groq Whisper preserves proper capitalization (names, places, etc.)
  2. PUNCTUATION: YouTube auto-captions have minimal punctuation.
     Groq Whisper adds periods, commas, etc.
  3. SEGMENTATION: YouTube splits into many small chunks (2-4 words each).
     Groq produces longer, sentence-like segments.
  4. ACCURACY: Both are ASR systems — errors differ but quality is comparable.
  5. COVERAGE: Check if durations match — YouTube video may include
     pre/post content not in the downloaded audio file.
  6. COST: YouTube captions are FREE. Groq costs ~$0.04-0.12/hr.

  Bottom line: YouTube captions are a viable FREE alternative for
  searchability and rough topic identification. Groq Whisper produces
  more readable, better-formatted transcripts suitable for analysis.
""")

if __name__ == "__main__":
    main()
