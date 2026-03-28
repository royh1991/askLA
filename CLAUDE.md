# askLA — LA City Council Data Pipeline

## What This Is

A pipeline for building a searchable database of LA City Council and committee meetings. Combines three data sources linked by PrimeGov `meeting.id`:

1. **Agenda documents** (10,672 files, 5.7 GB) — HTML/PDF agendas, journals, motions from PrimeGov API (2008-2026)
2. **YouTube captions** (1,590 transcripts, 20.9M words) — manual CC and auto-generated captions pulled via `youtube-transcript-api` through a Webshare rotating residential proxy
3. **Gemini-cleaned transcripts** — raw captions + agenda HTML sent to Gemini Flash, producing structured JSON aligned by agenda item with speaker identification, votes, and cleaned text

For **new meetings** where YouTube captions aren't ready yet, there's a direct path: download audio via yt-dlp → process through Gemini (audio → structured JSON + transcript in one API call, ~$0.35/meeting).

## Quick Start

```bash
# Dependencies
pip install curl_cffi yt-dlp google-genai youtube-transcript-api
brew install aria2 deno ffmpeg

# 1. Download agenda documents
python scrape_la_council.py --fresh

# 2. Pull YouTube captions for historical meetings (needs Webshare proxy)
python youtube_experiments/yt_captions/fetch_captions.py

# 3. Clean up captions via Gemini (agenda-aligned structured JSON)
python sample_pipeline/select_sample.py
python sample_pipeline/process_sample.py

# 4. For NEW meetings (no YT captions yet): direct audio → Gemini
python pipeline.py --download --meeting-id 17900
python pipeline.py --process

# 5. Build manifest and check status
python build_manifest.py
python pipeline.py --status
```

## Architecture

### Two Pipelines

```
HISTORICAL (2023+, bulk, cheap):                NEW MEETINGS (real-time, richer):

  youtube-transcript-api                          yt-dlp
  (via Webshare proxy)                            (audio download)
         │                                              │
         ▼                                              ▼
  yt_captions/transcripts/                        audio/m{id}_*.mp3
  m{id}_*.txt (raw CART)                                │
         │                                              ▼
         ├──── + agenda HTML ────┐                Gemini Flash
         │     from docs/        │                (audio → structured
         ▼                       │                 JSON + transcript)
  Gemini Flash                   │                      │
  (text cleanup +                │                      ▼
   agenda alignment)             │                transcripts/
         │                       │                m{id}_*.json + .txt
         ▼                       │
  sample_pipeline/output/        │
  m{id}_*.json (structured)      │
         │                       │
         └───────────┬───────────┘
                     ▼
              manifest.json
           (links everything)
```

### Primary Key: meeting.id

The PrimeGov `meeting.id` links everything. Every output file includes it:
- Agendas: `docs/YYYYMMDD/{date}_{title}_{template}.html`
- YouTube captions: `youtube_experiments/yt_captions/transcripts/m{id}_*.txt`
- Cleaned transcripts: `sample_pipeline/output/m{id}_*.json`
- Audio: `audio/m{id}_{date}_{title}.mp3`
- Gemini analysis: `transcripts/m{id}_*.json` + `.txt`
- Manifest: `manifest.json` keyed by meeting_id

77% of meetings (7,065 of 7,427) have a `videoUrl` field pointing to YouTube.

## File Structure

```
askLA/
├── CLAUDE.md                    # this file
├── .env                         # API keys (GEMINI_API_KEY, GROQ_API_KEY)
├── .yt-cookies.txt              # exported YouTube cookies
│
├── scrape_la_council.py         # PrimeGov API → docs/
├── download_audio.py            # YouTube audio downloader (yt-dlp + aria2c)
├── process_meeting.py           # Gemini: audio → structured JSON + transcript
├── batch_processing.py          # Gemini Batch API (50% discount, 24h turnaround)
├── pipeline.py                  # orchestrator: download + process + manifest
├── build_manifest.py            # generates manifest.json from filesystem
│
├── youtube_experiments/
│   └── yt_captions/
│       ├── fetch_captions.py    # youtube-transcript-api + Webshare proxy → captions
│       ├── progress.json        # tracks completed meeting IDs
│       └── transcripts/         # 1,590 raw caption files (m{id}_*.txt + .meta.json)
│
├── sample_pipeline/
│   ├── select_sample.py         # select meetings with both captions + agenda
│   ├── process_sample.py        # send to Gemini for cleanup
│   ├── prompt_v2.py             # the Gemini cleanup prompt (agenda-aligned)
│   ├── sample_plan.json         # selected meetings
│   └── output/                  # cleaned structured JSON per meeting
│
├── all_meetings.json            # PrimeGov metadata (~13 MB, 10,698 meetings)
├── manifest.json                # universal index: meeting_id → all file paths
├── download_progress.json       # doc_ids already downloaded
├── audio_progress.json          # meeting_ids with downloaded audio
│
├── audio/                       # YouTube audio (98 files, 6.5 GB)
├── docs/                        # 10,672 agenda documents (5.7 GB)
├── transcripts/                 # Gemini audio output (.json + .txt)
├── batches/                     # Gemini batch job state files
│
└── archive/                     # old experiments (whisper, yt-dlp subs, etc.)
```

## Scripts Reference

### scrape_la_council.py — Document Scraper

Downloads agendas, journals, and motions from the PrimeGov API.

```bash
python scrape_la_council.py              # incremental (default)
python scrape_la_council.py --fresh      # re-fetch metadata, download new docs only
python scrape_la_council.py --redownload # re-download everything
```

Idempotent. Progress tracked in `download_progress.json`.

### youtube_experiments/yt_captions/fetch_captions.py — YouTube Caption Fetcher

Pulls captions from YouTube via `youtube-transcript-api` with Webshare rotating residential proxy. Covers all meetings 2023+ that have YouTube videos.

```bash
python youtube_experiments/yt_captions/fetch_captions.py                    # all 2023-2026
python youtube_experiments/yt_captions/fetch_captions.py --years 2025 2026  # specific years
python youtube_experiments/yt_captions/fetch_captions.py --meeting-id 17900 # single meeting
python youtube_experiments/yt_captions/fetch_captions.py --stats            # show stats
python youtube_experiments/yt_captions/fetch_captions.py --dry-run          # preview
```

Idempotent. Progress tracked in `progress.json`. Skips meetings already fetched (including permanent failures like "no captions available").

**Current stats**: 1,590 transcripts (97% manual CC, 3% auto-generated), 20.9M words, 3,236 hours.

**Proxy config**: Webshare rotating residential at `p.webshare.io:80`. Credentials in the script. Rotates across 10 sticky endpoints to avoid burning IPs. YouTube blocks datacenter IPs and bans residential IPs after ~100 rapid requests, so the proxy + throttling is essential.

### sample_pipeline/ — Gemini Caption Cleanup

Takes raw YouTube captions + HTML agenda → produces structured JSON aligned by agenda item.

```bash
python sample_pipeline/select_sample.py                    # select meetings with both inputs
python sample_pipeline/process_sample.py                   # process all pending
python sample_pipeline/process_sample.py --meeting-id 17585  # single meeting
python sample_pipeline/process_sample.py --dry-run         # preview + cost estimate
python sample_pipeline/process_sample.py --stats           # show completion stats
```

**Output format** (per meeting JSON):
```json
{
  "meeting_id": 17585,
  "date": "2025-12-02",
  "title": "Government Operations Committee",
  "meeting_type": "committee",
  "sections": [
    {
      "section_type": "public_comment_period",
      "title": "Public Comment Period",
      "agenda_items_covered": [1, 4, 5],
      "council_files": ["25-1026"],
      "speakers": [{"name": "Maria Ponce", "role": "Public Commenter"}],
      "votes": [],
      "clean_transcript": "Full cleaned text with speaker labels..."
    }
  ]
}
```

**Section types**: `pre_roll`, `roll_call`, `consent_calendar`, `presentation`, `public_comment_period`, `agenda_item`, `closed_session`, `procedural`, `adjournment`.

**Cost**: ~$0.003/meeting sync, ~$0.0015/meeting batch. $3 for all 1,000 meetings.

**Known limitation**: Meetings over ~25K words can hit Gemini's output token limit, truncating the JSON. Long council meetings (30K+ words) may need chunking.

### download_audio.py — YouTube Audio Downloader

For new meetings where you need the actual audio file (e.g., for direct Gemini processing).

```bash
python download_audio.py export-cookies        # export Chrome cookies for parallel use
python download_audio.py download VIDEO_ID     # download one video
```

Uses aria2c for multi-connection downloads, deno for YouTube JS challenges.

### process_meeting.py — Gemini Audio Analysis

Uploads audio to Gemini Files API, produces structured JSON (speakers, votes, housing tags) + raw transcript in one API call.

```bash
python process_meeting.py audio/m17900_*.mp3                    # single file
python process_meeting.py audio/m17900_*.mp3 --meeting-id 17900 # embed meeting_id
```

**Cost**: ~$0.35/meeting (sync), ~$0.17/meeting (batch).

### batch_processing.py — Gemini Batch API

50% cost savings, 24-hour turnaround. Three phases: prepare → submit → retrieve.

```bash
python pipeline.py --batch-prepare --date-range 2025-01-01:2025-12-31 --submit
python pipeline.py --batch-status batches/batch_TIMESTAMP.json
python pipeline.py --batch-retrieve batches/batch_TIMESTAMP.json
```

### pipeline.py — Orchestrator

```bash
python pipeline.py --status                                    # manifest stats
python pipeline.py --run --date-range 2026-03-01:2026-03-31   # download + process
python pipeline.py --run --meeting-id 17900                    # single meeting
python pipeline.py --download --date-range 2026-01-01:2026-03-31  # audio only
python pipeline.py --process                                   # process unprocessed audio
python pipeline.py --housing-report                            # housing analysis
python pipeline.py --rebuild-manifest                          # rebuild manifest.json
```

### build_manifest.py — Manifest Generator

```bash
python build_manifest.py         # full rebuild
python build_manifest.py --stats # print statistics
```

## Data Pipeline: Recommended Workflows

### For new meetings (as they happen)

```bash
# Option A: Direct Gemini processing (richer output, $0.35/meeting)
python scrape_la_council.py --fresh
python pipeline.py --download --date-range 2026-03-20:2026-03-31
python pipeline.py --process
python build_manifest.py

# Option B: Wait for YouTube captions (free, then $0.003 cleanup)
python scrape_la_council.py --fresh
python youtube_experiments/yt_captions/fetch_captions.py --years 2026
python sample_pipeline/select_sample.py
python sample_pipeline/process_sample.py
```

### For bulk historical (already done for 2023-2026)

YouTube captions already pulled for 1,590 meetings. To clean them up:

```bash
python sample_pipeline/select_sample.py    # select meetings with agenda + caption
python sample_pipeline/process_sample.py   # send to Gemini (~$3 for 1,000 meetings)
```

## YouTube Caption Quality Notes

YouTube captions for LA City Council meetings come in two types:

| Type | Coverage | Quality |
|------|----------|---------|
| **Manual CC** (97% of 2023+) | Uploaded by City Clerk, CART stenography | Proper capitalization, some typos from live captioning |
| **Auto-generated** (3%) | YouTube ASR | All lowercase, no punctuation, comparable accuracy |

**Two different caption systems** exist in the raw data:
- **Full Council meetings**: ALL CAPS with `>> Speaker:` labels. Preceded by 18-49 min pre-roll video ("LA This Week").
- **Committee meetings**: Lowercase with NO speaker labels. Must infer speakers from context.

**Common CART errors** (corrected by Gemini cleanup):
- Council member names: "I CAN'T ROZ SKI" → Yaroslavsky, "JAOUR DO" → Jurado, "McOFFINGER" → McOsker
- Acronyms: "sequel" → CEQA, "five eyes" → five ayes, "Lhasa" → LAHSA, "Beatles" → BTEX
- Stenographic artifacts: `*F`, `ER` at line start, `SPSHZ` → specials

The Gemini cleanup prompt (`sample_pipeline/prompt_v2.py`) was developed by reading 20 full transcripts across all meeting types and includes a comprehensive error glossary.

## Traps to Avoid

### YouTube Caption Fetching

**YouTube bans your IP after ~100 rapid requests to the timedtext endpoint.** The ban persists for hours/days. Use the Webshare rotating residential proxy. Datacenter IPs (AWS, etc.) are permanently blocked.

**Webshare bandwidth limits.** The free plan uses datacenter IPs (blocked). Rotating residential starts at $3.50/1GB. Each caption fetch uses ~400KB. Monitor your bandwidth in the Webshare dashboard.

**`youtube-transcript-api` cookie auth is broken.** The library has it disabled in source code. Proxies are the only workaround for IP bans.

### YouTube Audio Downloads

**yt-dlp needs `deno` and `--remote-components ejs:github`.** Without these, YouTube JS challenges fail. Install deno: `brew install deno`.

**Parallel yt-dlp processes can't share `--cookies-from-browser chrome`.** Chrome's cookie DB gets locked. Export cookies once to `.yt-cookies.txt`.

**Cookies expire.** Re-run `export-cookies` if downloads fail with bot detection.

### PrimeGov / Document Downloads

**Use `curl_cffi`, not `requests`.** PrimeGov uses Cloudflare TLS fingerprinting. `curl_cffi` with `impersonate="chrome"` works.

**Large PDF timeouts.** Some are 280 MB. Use 300-second timeout.

### Gemini API

**Long meetings (30K+ words) can truncate JSON output.** Gemini hits output token limits. The cleanup pipeline works well for committee meetings (5-25K words). Full council meetings may need chunking.

**Gemini Batch API files expire after 48 hours.** Upload and submit in the same session.

**Gemini timestamps from audio are often wrong.** Minutes mapped to hours. YouTube caption timestamps are more reliable.

## Cost Summary

| Task | Method | Cost | Speed |
|------|--------|------|-------|
| YouTube captions (historical) | youtube-transcript-api + proxy | ~$3.50/1GB bandwidth | ~1 req/1.5s |
| Caption cleanup via Gemini | Gemini Flash (text in, JSON out) | ~$0.003/meeting | ~1 min/meeting |
| Direct audio processing | Gemini Flash (audio in) | ~$0.35/meeting sync, $0.17 batch | ~5 min/meeting |
| Audio download | yt-dlp + aria2c | Free | ~3-5 MB/s |
| Agenda download | PrimeGov API + curl_cffi | Free | ~10 docs/sec |

**Total cost to process all 1,590 historical meetings**: ~$5 (YouTube captions) + ~$5 (Gemini cleanup) = ~$10.

## API Keys

Stored in `.env` (gitignored):
```
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...     # only needed for archive/whisper_experiments
```

## Dependencies

```bash
pip install curl_cffi yt-dlp google-genai youtube-transcript-api
brew install aria2 deno ffmpeg
```

- **curl_cffi**: PrimeGov API (Cloudflare TLS bypass)
- **yt-dlp**: YouTube audio download
- **youtube-transcript-api**: YouTube caption extraction
- **google-genai**: Gemini API for structured analysis and caption cleanup
- **aria2c**: multi-connection download acceleration
- **deno**: YouTube JS challenge solving
- **ffmpeg**: audio preprocessing

## PrimeGov API Reference

Base URL: `https://lacity.primegov.com`

| Endpoint | Returns |
|----------|---------|
| `GET /api/v2/PublicPortal/GetArchivedMeetingYears` | `[2026, 2025, ..., 2008]` |
| `GET /api/v2/PublicPortal/ListArchivedMeetings?year=YYYY` | Array of meeting objects |
| `GET /api/v2/PublicPortal/ListUpcomingMeetings` | Array of upcoming meetings |

No authentication required. Requires Chrome-like TLS fingerprint (use `curl_cffi`).

### Meeting Object (key fields)

```json
{
  "id": 17654,
  "committeeId": 1,
  "dateTime": "2026-01-02T10:00:00",
  "title": "City Council Meeting",
  "videoUrl": "https://youtube.com/watch?v=ka4mEHoNTKw",
  "documentList": [
    {"id": 78452, "templateId": 149372, "compileOutputType": 3, "templateName": "HTML Agenda"},
    {"id": 78415, "templateId": 149372, "compileOutputType": 1, "templateName": "Agenda"}
  ]
}
```

### Known Data Quirks

- **Duplicate meetings**: some appear in both `upcoming` and the current year's archived list. Deduplicated by `doc_id`.
- **SAP entries**: every meeting has a parallel "- SAP" entry for Sign & Audio Program. Video-only, no agendas. Filtered out by scraper but YouTube captions are available for some.
- **Committee name variations**: names changed over the years. Preserved as-is.
- **videoUrl coverage**: 99-100% for 2008-2013, ~67-79% for 2014-2025, 82% for 2026.
- **YouTube caption coverage**: 97% manual CC for 2021+. Pre-2021 meetings have auto-generated only or no captions. The Granicus platform (`lacity.granicus.com`) has professional CART transcripts for 2016-2021 council meetings (~3,465 clips).
