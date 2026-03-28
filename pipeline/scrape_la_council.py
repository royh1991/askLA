#!/usr/bin/env python3
"""
Scrape LA City Council meeting agendas from the PrimeGov API.

Usage:
    python scrape_la_council.py              # incremental: fetch metadata, download new docs
    python scrape_la_council.py --fresh      # re-fetch metadata from API (still skips already-downloaded docs)
    python scrape_la_council.py --redownload # re-download everything from scratch

Output structure:
    docs/
    ├── 20260109/
    │   ├── 2026-01-09_City_Council_Meeting_HTML_Agenda.html
    │   ├── 2026-01-09_City_Council_Meeting_Agenda.pdf
    │   └── ...
    └── ...

Idempotency:
    - download_progress.json tracks doc IDs already saved to disk.
    - Re-running downloads only new/missing documents.
    - all_meetings.json is the cached API response; delete it or pass --fresh to re-fetch.
"""

import argparse
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from curl_cffi import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_URL = "https://lacity.primegov.com"
API_URL = f"{BASE_URL}/api/v2/PublicPortal"

PROJECT_DIR = Path(__file__).resolve().parent
DOCS_DIR = PROJECT_DIR / "docs"
PROGRESS_FILE = PROJECT_DIR / "download_progress.json"
MEETINGS_FILE = PROJECT_DIR / "all_meetings.json"

YEARS = list(range(2026, 2007, -1))  # 2026 down to 2008

# curl_cffi is required because the PrimeGov API returns 403 to Python's
# default urllib/requests TLS fingerprint. curl_cffi with impersonate="chrome"
# sends a Chrome-like TLS handshake that Cloudflare accepts.
# Plain `curl` from the command line also works (its TLS stack is acceptable).
SESSION_KWARGS = {"impersonate": "chrome"}

# Large PDFs (some are 100-280 MB) need a generous timeout. The initial run
# used 60s which caused 30 timeouts on files >15 MB. 300s handles all of them.
DOWNLOAD_TIMEOUT = 300
METADATA_TIMEOUT = 30
MAX_WORKERS = 10

# ---------------------------------------------------------------------------
# Document filtering
# ---------------------------------------------------------------------------

# Template names we never want — these are not agendas.
SKIP_TEMPLATES = frozenset({
    "HTML Recess Notice",
    "Recess Notice",
    "HTML Notice of Cancellation",
    "Notice of Cancellation",
    "HTML SAP Video",
})

# Template names we DO want.
DOWNLOAD_TEMPLATES = frozenset({
    "HTML Agenda",
    "Agenda",
    "HTML Special Agenda",
    "Special Agenda",
    "HTML Continuation Agenda",
    "Continuation Agenda",
    "HTML Revised Agenda",
    "Revised Agenda",
    "HTML Journal",
    "Journal",
    "Presented Motions and Resolutions",
    "Special Meeting Journal",
})

# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------


def fetch_all_meetings(session):
    """Fetch meeting metadata for every archived year + upcoming meetings."""
    all_meetings = {}

    for year in YEARS:
        url = f"{API_URL}/ListArchivedMeetings?year={year}"
        resp = session.get(url, timeout=METADATA_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        all_meetings[str(year)] = data
        print(f"  {year}: {len(data)} meetings")

    url = f"{API_URL}/ListUpcomingMeetings"
    resp = session.get(url, timeout=METADATA_TIMEOUT)
    resp.raise_for_status()
    upcoming = resp.json()
    all_meetings["upcoming"] = upcoming
    print(f"  upcoming: {len(upcoming)} meetings")

    MEETINGS_FILE.write_text(json.dumps(all_meetings, indent=2))
    print(f"  Saved → {MEETINGS_FILE}")
    return all_meetings


# ---------------------------------------------------------------------------
# Filtering & download-list construction
# ---------------------------------------------------------------------------


def _is_skip_meeting(meeting):
    """Return True for meetings we should skip entirely."""
    title_lower = meeting["title"].lower()

    # Explicitly cancelled meetings
    if "cancelled" in title_lower or "canceled" in title_lower:
        return True

    # SAP-only entries (Sign & Audio Program video — no agenda content)
    if "- SAP" in meeting["title"] or meeting["title"].strip().endswith("SAP"):
        return True

    docs = meeting.get("documentList", [])

    # No documents at all
    if not docs:
        return True

    # Every document is a recess/cancellation/SAP notice
    if all(d["templateName"] in SKIP_TEMPLATES for d in docs):
        return True
    if all("SAP" in d["templateName"] for d in docs):
        return True

    return False


def _sanitize(name, max_len=150):
    """Make a string safe for use as a filename component."""
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    name = re.sub(r"\s+", "_", name)
    return name.strip("_.")[: max_len]


def build_download_list(all_meetings):
    """Return a list of dicts describing every document to download."""
    downloads = []

    for _year_key, meetings in all_meetings.items():
        for meeting in meetings:
            if _is_skip_meeting(meeting):
                continue

            meeting_date = meeting["dateTime"][:10]  # "YYYY-MM-DD"
            date_folder = meeting_date.replace("-", "")  # "YYYYMMDD"
            safe_title = _sanitize(meeting["title"])

            # Collect wanted docs, keyed by templateId
            html_by_tid = {}
            pdf_by_tid = {}

            for doc in meeting.get("documentList", []):
                tname = doc["templateName"]
                if tname not in DOWNLOAD_TEMPLATES:
                    continue

                tid = doc["templateId"]
                otype = doc["compileOutputType"]  # 3 = HTML, 1 = PDF

                if otype == 3:
                    html_by_tid[tid] = doc
                elif otype == 1:
                    pdf_by_tid[tid] = doc

            # Prefer HTML; keep PDFs only when no HTML shares the same templateId
            chosen = list(html_by_tid.values())
            for tid, doc in pdf_by_tid.items():
                if tid not in html_by_tid:
                    chosen.append(doc)

            for doc in chosen:
                otype = doc["compileOutputType"]
                tid = doc["templateId"]

                if otype == 3:
                    url = f"{BASE_URL}/Portal/Meeting?meetingTemplateId={tid}"
                    ext = "html"
                else:
                    url = f"{BASE_URL}/Public/CompiledDocument?meetingTemplateId={tid}&compileOutputType=1"
                    ext = "pdf"

                safe_tpl = _sanitize(doc["templateName"])
                filename = f"{meeting_date}_{safe_title}_{safe_tpl}.{ext}"

                downloads.append({
                    "url": url,
                    "folder": date_folder,
                    "filename": filename,
                    "doc_id": doc["id"],
                    "meeting_id": meeting["id"],
                    "meeting_title": meeting["title"],
                    "meeting_date": meeting_date,
                    "template_name": doc["templateName"],
                })

    return downloads


# ---------------------------------------------------------------------------
# Progress tracking
# ---------------------------------------------------------------------------


def _load_progress():
    if PROGRESS_FILE.exists():
        return set(json.loads(PROGRESS_FILE.read_text()))
    return set()


def _save_progress(downloaded):
    PROGRESS_FILE.write_text(json.dumps(sorted(downloaded)))


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------


def _download_one(item, session):
    """Download a single document. Returns a result dict."""
    folder = DOCS_DIR / item["folder"]
    folder.mkdir(parents=True, exist_ok=True)
    filepath = folder / item["filename"]

    resp = session.get(item["url"], timeout=DOWNLOAD_TIMEOUT)
    resp.raise_for_status()

    if filepath.suffix == ".html":
        filepath.write_text(resp.text, encoding="utf-8")
    else:
        filepath.write_bytes(resp.content)

    return {"status": "ok", "doc_id": item["doc_id"], "size": len(resp.content)}


def download_all(downloads, downloaded):
    """Download documents, skipping those already in the progress set."""
    remaining = [d for d in downloads if d["doc_id"] not in downloaded]

    if not remaining:
        print("  All documents already downloaded.")
        return

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session(**SESSION_KWARGS)

    ok = err = 0
    errors = []

    print(f"  Downloading {len(remaining)} documents ({MAX_WORKERS} threads)...")
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(_download_one, item, session): item for item in remaining}

        for i, future in enumerate(as_completed(futures), 1):
            item = futures[future]
            try:
                result = future.result()
                ok += 1
                downloaded.add(result["doc_id"])
            except Exception as e:
                err += 1
                errors.append({"doc_id": item["doc_id"], "url": item["url"], "error": str(e)})

            if i % 100 == 0 or i == len(remaining):
                print(f"    {i}/{len(remaining)}  ok={ok}  err={err}")
                _save_progress(downloaded)

    _save_progress(downloaded)
    print(f"  Done: {ok} downloaded, {err} errors")

    if errors:
        err_file = PROJECT_DIR / "download_errors.json"
        err_file.write_text(json.dumps(errors, indent=2))
        print(f"  Errors saved → {err_file}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Download LA City Council agendas")
    parser.add_argument("--fresh", action="store_true",
                        help="Re-fetch meeting metadata from API (still skips already-downloaded docs)")
    parser.add_argument("--redownload", action="store_true",
                        help="Clear progress and re-download everything")
    args = parser.parse_args()

    session = requests.Session(**SESSION_KWARGS)

    # Step 1 — Meeting metadata
    if args.fresh or not MEETINGS_FILE.exists():
        print("Fetching meeting metadata from API...")
        all_meetings = fetch_all_meetings(session)
    else:
        print("Loading cached meeting metadata...")
        all_meetings = json.loads(MEETINGS_FILE.read_text())
        total = sum(len(v) for v in all_meetings.values())
        print(f"  {total} meetings across {len(all_meetings)} year groups")

    # Step 2 — Build download list
    print("Building download list...")
    downloads = build_download_list(all_meetings)
    html_n = sum(1 for d in downloads if d["filename"].endswith(".html"))
    pdf_n = len(downloads) - html_n
    print(f"  {len(downloads)} documents ({html_n} HTML, {pdf_n} PDF)")

    # Step 3 — Download
    if args.redownload:
        PROGRESS_FILE.unlink(missing_ok=True)

    downloaded = _load_progress()
    print(f"  Already downloaded: {len(downloaded)}")
    download_all(downloads, downloaded)


if __name__ == "__main__":
    main()
