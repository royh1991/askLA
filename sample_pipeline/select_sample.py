#!/usr/bin/env python3
"""
Select 100 most recent meetings that have both YouTube captions and agenda HTML.
Outputs sample_plan.json with all paths and metadata.
"""
import json
import re
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
MANIFEST_PATH = PROJECT_DIR / "manifest.json"
YT_CAPTIONS_DIR = PROJECT_DIR / "youtube_experiments" / "yt_captions" / "transcripts"
OUTPUT_PATH = Path(__file__).resolve().parent / "sample_plan.json"


def sanitize_title(title):
    title = re.sub(r'[^\w\s-]', '', title)
    title = re.sub(r'\s+', '_', title.strip())
    return title


def main():
    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)

    # Load all YT caption metadata
    yt_metas = {}
    for mf in YT_CAPTIONS_DIR.glob("*.meta.json"):
        with open(mf) as f:
            meta = json.load(f)
        yt_metas[str(meta["meeting_id"])] = meta

    # Find meetings with both caption + agenda HTML
    candidates = []
    for mid, yt in yt_metas.items():
        m = manifest.get(mid, {})
        doc_paths = m.get("doc_paths", [])
        # Prefer HTML Agenda, fall back to HTML Special/Revised/Continuation Agenda
        agenda_htmls = [d for d in doc_paths if "Agenda" in d and d.endswith(".html")]
        if not agenda_htmls:
            continue

        txt_stem = f"m{mid}_{yt['date']}_{sanitize_title(yt['title'])}"
        txt_path = YT_CAPTIONS_DIR / f"{txt_stem}.txt"
        if not txt_path.exists():
            continue

        candidates.append({
            "meeting_id": int(mid),
            "date": yt["date"],
            "title": yt["title"],
            "caption_type": yt.get("caption_type", "unknown"),
            "total_words": yt.get("total_words", 0),
            "duration_seconds": yt.get("duration_seconds", 0),
            "transcript_path": str(txt_path.relative_to(PROJECT_DIR)),
            "agenda_path": agenda_htmls[0],  # first match
            "video_url": yt.get("video_url", ""),
        })

    # Sort by date descending, take 100
    candidates.sort(key=lambda x: x["date"], reverse=True)
    sample = candidates[:100]

    with open(OUTPUT_PATH, "w") as f:
        json.dump(sample, f, indent=2)

    print(f"Selected {len(sample)} meetings")
    print(f"Date range: {sample[-1]['date']} to {sample[0]['date']}")
    print(f"Total words: {sum(m['total_words'] for m in sample):,}")
    print(f"Total duration: {sum(m['duration_seconds'] for m in sample)/3600:.1f} hours")
    print(f"Caption types: {dict((t, sum(1 for m in sample if m['caption_type']==t)) for t in set(m['caption_type'] for m in sample))}")
    print(f"Saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
