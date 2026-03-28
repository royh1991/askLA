#!/usr/bin/env python3
"""
Stratified sampling of ~100 meetings to research canonical transcript format.

One-time research tool. Selects meetings across committee types, time periods,
and durations, then downloads audio, processes with Gemini (via batch API),
and analyzes the results to evaluate schema fitness.

Usage:
    python sample_transcripts.py --select              # Pick ~100 meetings, save sample_plan.json
    python sample_transcripts.py --download            # Download audio for selected meetings
    python sample_transcripts.py --process             # Process via batch API
    python sample_transcripts.py --process --sync      # Process synchronously (more expensive)
    python sample_transcripts.py --analyze             # Analyze transcripts, output report
"""

import argparse
import json
import random
import re
from collections import defaultdict
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
MEETINGS_FILE = PROJECT_DIR / "all_meetings.json"
SAMPLE_PLAN_FILE = PROJECT_DIR / "sample_plan.json"
TRANSCRIPTS_DIR = PROJECT_DIR / "transcripts"

# Category mapping: committee name patterns -> category
CATEGORY_PATTERNS = [
    (r"city council meeting|regular city council", "City Council"),
    (r"planning and land use|plum", "PLUM Committee"),
    (r"housing|homelessness", "Housing Committee"),
    (r"budget and finance|budget hearing", "Budget & Finance"),
    (r"transportation", "Transportation"),
    (r"public safety", "Public Safety"),
    (r"energy|environment", "Energy & Environment"),
    (r"trade|travel|tourism|economic development|economic dev", "Trade/Tourism/Economic Dev"),
    (r"personnel|hiring|rules|election|intergovernmental|government operation|government efficiency|audit", "Procedural Committees"),
    (r"special\s*-\s*|special meeting|joint committee", "Special Meetings"),
]

# Target counts per category
CATEGORY_TARGETS = {
    "City Council": 15,
    "PLUM Committee": 12,
    "Housing Committee": 10,
    "Budget & Finance": 8,
    "Transportation": 8,
    "Public Safety": 8,
    "Energy & Environment": 6,
    "Trade/Tourism/Economic Dev": 6,
    "Procedural Committees": 6,
    "Special Meetings": 5,
    "Other": 16,
}

# Time period buckets
TIME_PERIODS = [
    ("2008-2013", "2008-01-01", "2013-12-31"),
    ("2014-2019", "2014-01-01", "2019-12-31"),
    ("2020-2021", "2020-01-01", "2021-12-31"),
    ("2022-2026", "2022-01-01", "2026-12-31"),
]


def _categorize(title):
    """Map a meeting title to a category."""
    title_lower = title.lower()
    for pattern, category in CATEGORY_PATTERNS:
        if re.search(pattern, title_lower):
            return category
    return "Other"


def select_sample(seed=42):
    """Select ~100 meetings across strata. Saves sample_plan.json."""
    if not MEETINGS_FILE.exists():
        print(f"ERROR: {MEETINGS_FILE} not found.")
        return None

    data = json.loads(MEETINGS_FILE.read_text())

    # Flatten all meetings, filter to those with videoUrl, not SAP/cancelled
    eligible = []
    for _year, meetings in data.items():
        for m in meetings:
            if not m.get("videoUrl"):
                continue
            title = m.get("title", "")
            title_lower = title.lower()
            if "cancelled" in title_lower or "canceled" in title_lower:
                continue
            if "- SAP" in title or title.strip().endswith("SAP"):
                continue
            if not m.get("documentList"):
                continue
            eligible.append(m)

    # Deduplicate by id
    seen = set()
    unique = []
    for m in eligible:
        if m["id"] not in seen:
            seen.add(m["id"])
            unique.append(m)
    eligible = unique

    print(f"Eligible meetings: {len(eligible)}")

    # Bucket by (category, time_period)
    buckets = defaultdict(list)
    for m in eligible:
        cat = _categorize(m["title"])
        date = m["dateTime"][:10]
        period = "other"
        for pname, pstart, pend in TIME_PERIODS:
            if pstart <= date <= pend:
                period = pname
                break
        buckets[(cat, period)].append(m)

    # Print distribution
    print("\nEligible distribution:")
    for cat in sorted(set(c for c, _ in buckets.keys())):
        total = sum(len(buckets[(cat, pname)]) for pname, _, _ in TIME_PERIODS)
        periods = ", ".join(f"{pname}={len(buckets.get((cat, pname), []))}" for pname, _, _ in TIME_PERIODS)
        print(f"  {cat}: {total} ({periods})")

    # Sample
    random.seed(seed)
    selected = []

    for cat, target in CATEGORY_TARGETS.items():
        # Spread across time periods
        period_names = [p for p, _, _ in TIME_PERIODS]
        per_period = max(1, target // len(period_names))

        for pname, _, _ in TIME_PERIODS:
            pool = buckets.get((cat, pname), [])
            n = min(per_period, len(pool))
            if n > 0:
                selected.extend(random.sample(pool, n))

        # Fill remaining from any period
        current = sum(1 for s in selected if _categorize(s["title"]) == cat)
        if current < target:
            all_pool = []
            for pname, _, _ in TIME_PERIODS:
                all_pool.extend(buckets.get((cat, pname), []))
            selected_ids = {s["id"] for s in selected}
            remaining = [m for m in all_pool if m["id"] not in selected_ids]
            need = target - current
            if remaining:
                selected.extend(random.sample(remaining, min(need, len(remaining))))

    # Deduplicate (shouldn't happen but be safe)
    seen = set()
    final = []
    for m in selected:
        if m["id"] not in seen:
            seen.add(m["id"])
            final.append(m)

    # Build plan
    plan = []
    for m in sorted(final, key=lambda x: x["dateTime"]):
        plan.append({
            "meeting_id": m["id"],
            "title": m["title"],
            "date": m["dateTime"][:10],
            "videoUrl": m["videoUrl"],
            "category": _categorize(m["title"]),
        })

    SAMPLE_PLAN_FILE.write_text(json.dumps(plan, indent=2))

    # Summary
    cat_counts = defaultdict(int)
    for p in plan:
        cat_counts[p["category"]] += 1

    print(f"\nSelected {len(plan)} meetings:")
    for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")
    print(f"\nSaved: {SAMPLE_PLAN_FILE}")
    return plan


def download_sample():
    """Download audio for all meetings in sample_plan.json."""
    if not SAMPLE_PLAN_FILE.exists():
        print(f"No {SAMPLE_PLAN_FILE}. Run --select first.")
        return

    plan = json.loads(SAMPLE_PLAN_FILE.read_text())

    # Load full meeting objects for download_by_meeting
    data = json.loads(MEETINGS_FILE.read_text())
    meetings_by_id = {}
    for _year, meetings in data.items():
        for m in meetings:
            meetings_by_id[m["id"]] = m

    from download_audio import download_meetings

    to_download = []
    for entry in plan:
        mid = entry["meeting_id"]
        if mid in meetings_by_id:
            to_download.append(meetings_by_id[mid])
        else:
            print(f"  WARNING: meeting {mid} not found in all_meetings.json")

    print(f"Downloading audio for {len(to_download)} meetings...")
    download_meetings(to_download)


def process_sample(model="gemini-2.5-flash", sync=False):
    """Process sample meetings via batch or sync API."""
    if not SAMPLE_PLAN_FILE.exists():
        print(f"No {SAMPLE_PLAN_FILE}. Run --select first.")
        return

    plan = json.loads(SAMPLE_PLAN_FILE.read_text())

    data = json.loads(MEETINGS_FILE.read_text())
    meetings_by_id = {}
    for _year, meetings in data.items():
        for m in meetings:
            meetings_by_id[m["id"]] = m

    to_process = []
    for entry in plan:
        mid = entry["meeting_id"]
        if mid in meetings_by_id:
            to_process.append(meetings_by_id[mid])

    if sync:
        from download_audio import meeting_audio_filename, _sanitize
        from process_meeting import process_single, TRANSCRIPTS_DIR as TD
        import time

        TD.mkdir(parents=True, exist_ok=True)
        ok = err = skip = 0
        for m in to_process:
            stem = f"m{m['id']}_{m['dateTime'][:10]}_{_sanitize(m['title'])}"
            audio_path = Path(PROJECT_DIR / "audio" / meeting_audio_filename(m))
            json_path = TD / f"{stem}.json"

            if json_path.exists():
                skip += 1
                continue
            if not audio_path.exists():
                print(f"  No audio for m{m['id']}, skipping")
                skip += 1
                continue

            try:
                process_single(str(audio_path), str(json_path), model=model, meeting_id=m["id"])
                ok += 1
                time.sleep(2)
            except Exception as e:
                print(f"  ERROR m{m['id']}: {e}")
                err += 1

        print(f"\nDone: {ok} processed, {skip} skipped, {err} errors")
    else:
        from batch_processing import prepare_batch, submit_batch
        state_file = prepare_batch(to_process, model=model)
        if state_file:
            print(f"\nBatch prepared. Submit with:")
            print(f"  python pipeline.py --batch-submit {state_file}")
            print(f"\nOr auto-submit now? Run:")
            print(f"  python batch_processing.py submit {state_file}")


def analyze_sample():
    """Analyze all sample transcripts and produce a report."""
    if not SAMPLE_PLAN_FILE.exists():
        print(f"No {SAMPLE_PLAN_FILE}. Run --select first.")
        return

    plan = json.loads(SAMPLE_PLAN_FILE.read_text())

    results = []
    missing = 0
    parse_errors = 0

    for entry in plan:
        mid = entry["meeting_id"]
        # Find matching transcript
        pattern = f"m{mid}_*.json"
        matches = list(TRANSCRIPTS_DIR.glob(pattern))
        if not matches:
            missing += 1
            continue

        try:
            data = json.loads(matches[0].read_text())
            data["_category"] = entry["category"]
            data["_meeting_id"] = mid
            results.append(data)
        except (json.JSONDecodeError, KeyError) as e:
            parse_errors += 1
            print(f"  Parse error for m{mid}: {e}")

    if not results:
        print("No transcripts to analyze. Run --process first.")
        return

    print(f"Analyzing {len(results)} transcripts ({missing} missing, {parse_errors} parse errors)...\n")

    # --- Analysis ---
    report = []
    report.append(f"# Sample Transcript Analysis")
    report.append(f"\nAnalyzed: {len(results)} transcripts")
    report.append(f"Missing: {missing}")
    report.append(f"Parse errors: {parse_errors}")

    # Items per meeting by category
    report.append(f"\n## Items Discussed per Meeting")
    by_cat = defaultdict(list)
    for r in results:
        cat = r.get("_category", "?")
        n_items = len(r.get("items_discussed", []))
        by_cat[cat].append(n_items)

    for cat in sorted(by_cat.keys()):
        counts = by_cat[cat]
        avg = sum(counts) / len(counts)
        report.append(f"  {cat}: avg={avg:.1f}, min={min(counts)}, max={max(counts)}, n={len(counts)}")

    # Council file population rate
    report.append(f"\n## Council File Population")
    total_items = 0
    items_with_cf = 0
    for r in results:
        for item in r.get("items_discussed", []):
            total_items += 1
            if item.get("council_file"):
                items_with_cf += 1
    report.append(f"  {items_with_cf}/{total_items} items have council_file ({items_with_cf/total_items*100:.0f}%)" if total_items else "  No items")

    # Vote result vocabulary
    report.append(f"\n## Vote Result Values")
    vote_values = defaultdict(int)
    for r in results:
        for item in r.get("items_discussed", []):
            vote = item.get("vote", {})
            result = vote.get("result", "missing")
            vote_values[result] += 1
    for val, count in sorted(vote_values.items(), key=lambda x: -x[1]):
        report.append(f"  {val}: {count}")

    # Speaker roles
    report.append(f"\n## Speaker Roles")
    role_counts = defaultdict(int)
    for r in results:
        for item in r.get("items_discussed", []):
            for speaker in item.get("speakers", []):
                role = speaker.get("role", "unknown")
                role_counts[role] += 1
    for role, count in sorted(role_counts.items(), key=lambda x: -x[1]):
        report.append(f"  {role}: {count}")

    # Housing relevance by category
    report.append(f"\n## Housing Relevance by Category")
    for cat in sorted(by_cat.keys()):
        cat_results = [r for r in results if r.get("_category") == cat]
        total = sum(len(r.get("items_discussed", [])) for r in cat_results)
        housing = sum(
            sum(1 for i in r.get("items_discussed", []) if i.get("housing_relevant"))
            for r in cat_results
        )
        pct = housing / total * 100 if total else 0
        report.append(f"  {cat}: {housing}/{total} items housing-relevant ({pct:.0f}%)")

    # Housing tags distribution
    report.append(f"\n## Housing Tag Distribution")
    tag_counts = defaultdict(int)
    for r in results:
        for item in r.get("items_discussed", []):
            for tag in item.get("housing_tags", []):
                tag_counts[tag] += 1
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])[:20]:
        report.append(f"  {tag}: {count}")

    # Transcript presence
    report.append(f"\n## Raw Transcript Coverage")
    has_txt = 0
    for entry in plan:
        mid = entry["meeting_id"]
        txt_matches = list(TRANSCRIPTS_DIR.glob(f"m{mid}_*.txt"))
        if txt_matches:
            has_txt += 1
    report.append(f"  {has_txt}/{len(plan)} have raw transcript .txt files")

    # Duration accuracy
    report.append(f"\n## Duration (minutes) by Category")
    for cat in sorted(by_cat.keys()):
        cat_results = [r for r in results if r.get("_category") == cat]
        durations = [r.get("duration_minutes", 0) for r in cat_results if r.get("duration_minutes")]
        if durations:
            avg = sum(durations) / len(durations)
            report.append(f"  {cat}: avg={avg:.0f}min, min={min(durations)}, max={max(durations)}")

    report_text = "\n".join(report)
    print(report_text)

    report_file = PROJECT_DIR / "sample_analysis.md"
    report_file.write_text(report_text)
    print(f"\nReport saved: {report_file}")


def main():
    parser = argparse.ArgumentParser(description="Stratified transcript sampling for schema research")
    parser.add_argument("--select", action="store_true", help="Select ~100 meetings")
    parser.add_argument("--download", action="store_true", help="Download audio for selected meetings")
    parser.add_argument("--process", action="store_true", help="Process with Gemini")
    parser.add_argument("--analyze", action="store_true", help="Analyze transcript quality")
    parser.add_argument("--sync", action="store_true", help="Use synchronous API instead of batch")
    parser.add_argument("--model", default="gemini-2.5-flash")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for selection")

    args = parser.parse_args()

    if args.select:
        select_sample(seed=args.seed)
    elif args.download:
        download_sample()
    elif args.process:
        process_sample(model=args.model, sync=args.sync)
    elif args.analyze:
        analyze_sample()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
