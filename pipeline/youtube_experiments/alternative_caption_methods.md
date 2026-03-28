# Alternative YouTube Caption Extraction Methods

Research into more robust alternatives to `youtube-transcript-api` for bulk caption
downloading (~2,166 LA City Council meetings, 2023+).

## The Problem

`youtube-transcript-api` uses plain Python `requests` to hit YouTube's `timedtext`
endpoint. After ~100 rapid requests, YouTube bans the IP from that endpoint (HTTP 429).
The ban persists for hours to days. Cookies don't help. Cloud IPs (AWS) are permanently
blocked.

## Methods Evaluated

### 1. yt-dlp with `--sleep-subtitles` (RECOMMENDED)

**Status: VIABLE - best option for bulk without proxies**

yt-dlp has built-in rate limiting specifically for subtitle downloads, TLS impersonation
via `curl_cffi`, and cookie support. Unlike `youtube-transcript-api`, it impersonates a
real browser's TLS fingerprint.

Key flags:
- `--sleep-subtitles 5` — sleep 5s before each subtitle download
- `--sleep-requests 0.75` — sleep between metadata requests
- `--sleep-interval 10 --max-sleep-interval 20` — randomized sleep between videos
- `-t sleep` — preset that combines all of the above
- `--impersonate chrome` — uses `curl_cffi` for Chrome TLS fingerprinting
- `--no-overwrites` — skip already downloaded (resumable)
- `--batch-file urls.txt` — read video URLs from file

```bash
yt-dlp \
  --skip-download \
  --write-subs \
  --write-auto-subs \
  --sub-langs "en" \
  --sub-format "json3" \
  -t sleep \
  --impersonate chrome \
  --cookies .yt-cookies.txt \
  --ignore-errors \
  --no-overwrites \
  -o "youtube_experiments/yt_captions/subtitles/%(id)s.%(ext)s" \
  --batch-file youtube_experiments/yt_captions/video_urls.txt
```

**Speed**: ~2-3 videos/minute with `-t sleep`. ~2,000 videos in 11-17 hours.

**Faster (moderate risk)**:
```bash
--sleep-subtitles 2 --sleep-requests 0.5 --sleep-interval 3 --max-sleep-interval 8
```
~2,000 videos in 3-6 hours.

**Pros**: Built-in rate limiting, TLS impersonation, cookie support, batch file, resumable
**Cons**: Slower than youtube-transcript-api. Still same IP, could get banned if too fast.

### 2. youtube-transcript-api + Rotating Residential Proxy ($3.50-14)

**Status: VIABLE - most reliable for bulk**

The library has built-in `WebshareProxyConfig` that auto-rotates IPs on 429:

```python
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig

api = YouTubeTranscriptApi(
    proxy_config=WebshareProxyConfig(
        proxy_username="YOUR_USERNAME",
        proxy_password="YOUR_PASSWORD",
        filter_ip_locations=["us"],
        retries_when_blocked=10,  # auto-retry with new IP
    )
)
transcript = api.fetch(video_id)
```

Or with any proxy provider via `GenericProxyConfig`:
```python
from youtube_transcript_api.proxies import GenericProxyConfig

api = YouTubeTranscriptApi(
    proxy_config=GenericProxyConfig(
        https_url="socks5://user:pass@rotating-proxy:port"
    )
)
```

**Cost**: ~400KB per request. 2,166 meetings = ~870MB. Webshare residential: $3.50/1GB.
**Note**: Free Webshare plan uses datacenter IPs which are blocked. Must pay for residential.

**Pros**: Fast (can do 1-2s between requests), reliable with IP rotation
**Cons**: Costs money, requires account setup

### 3. Invidious API (Third-party YouTube frontend)

**Status: UNRELIABLE - not recommended for bulk**

Tested on 2026-03-26:
- `inv.nadeko.net` — lists caption tracks but returns empty content
- `invidious.nerdvpn.de` — returns bot challenge HTML
- `iv.datura.network`, `inv.tux.pizza` — DNS resolution failures
- Most Piped API instances — HTTP 521/522 (down)

Public Invidious instances are:
- Frequently offline or overloaded
- Subject to the same YouTube bans (they proxy to YouTube)
- Rate-limited themselves to prevent abuse
- Not suitable for thousands of requests

Self-hosting Invidious is possible but just moves the YouTube ban problem to your server's IP.

### 4. YouTube Data API v3

**Status: NOT VIABLE for this use case**

- `captions.list` (API key only): can list available caption tracks, 50 quota units/call
- `captions.download` (OAuth required): requires you to OWN the video
- Daily quota: 10,000 units = 200 list calls or 50 download calls max
- Cannot download captions from third-party videos. Dead end for LA City Council.

### 5. Headless Browser (Selenium/Playwright)

**Status: WON'T HELP**

The YouTube ban is **IP-based**, not fingerprint-based. Even a real Chrome browser on the
same IP gets 429'd on the timedtext endpoint. We confirmed this: `curl_cffi` with Chrome
TLS impersonation still gets 429.

A headless browser would add complexity without solving the core problem. Only useful if
combined with a proxy (at which point, just use the proxy with youtube-transcript-api).

### 6. Granicus CART Transcripts (Official City Source)

**Status: VIABLE for 2016-2021 ONLY**

The LA City Clerk hosted professional CART (Computer-Aided Real-Time Translation)
transcripts on Granicus at `lacity.granicus.com`. These are human-generated verbatim
transcripts — higher quality than YouTube captions or Groq Whisper.

**Tested and confirmed working:**
- `https://lacity.granicus.com/ViewPublisher.php?view_id=129` — 1,614 council clips
- `https://lacity.granicus.com/ViewPublisher.php?view_id=46` — 1,851 committee clips
- `https://lacity.granicus.com/TranscriptViewer.php?view_id=129&clip_id=20580` — transcript viewer
- RSS feed: `https://lacity.granicus.com/ViewPublisherRSS.php?view_id=129`

**Quality**: Excellent. Professional CART with speaker labels (">> blumenfield. Bonin. >> bonin, present.")
**Coverage**: ~2016 to March 2021 only (clip IDs 2765-20580)
**Limitation**: LA City Clerk stopped using Granicus ~2021, switched to PrimeGov + YouTube.

For 2023+ meetings (our target), Granicus has no data. But this is a goldmine for
historical meetings if we want transcripts for the 2016-2021 era without paying for
Groq/Gemini.

### 7. Innertube get_transcript API (Experimental)

**Status: PROMISING but needs reverse-engineering**

YouTube's transcript panel UI uses a different innertube endpoint
(`/youtubei/v1/get_transcript`) that reportedly has much more relaxed rate limits than
the timedtext endpoint. It returns transcript data directly without a separate fetch.

The challenge: the `params` field is a base64-encoded protobuf message that needs to be
reverse-engineered from a real browser session.

References:
- https://gist.github.com/MinePlayersPE/f645f15d477be694748df721492d8a38
- https://nadimtuhin.com/blog/ytranscript-how-it-works

Worth investigating as a long-term solution if the timedtext ban keeps being a problem.

### 8. Router Restart

**Status: WORKS if ISP assigns dynamic IPs**

Restarting your router gets a new IP from most residential ISPs. This immediately
clears the YouTube ban. Combine with slower request rates to avoid re-triggering.

## Recommendation

### For immediate use (free):

**Option A: Wait + yt-dlp with `-t sleep`**

Wait for IP ban to lift (or restart router), then use the yt-dlp wrapper script
(`fetch_captions_ytdlp.py`) with conservative rate limiting. Estimated 11-17 hours
for all 2,064 remaining meetings.

### For fastest results ($3.50):

**Option B: Webshare residential proxy + youtube-transcript-api**

Sign up for Webshare residential proxy ($3.50/1GB), add credentials to the
existing `fetch_captions.py` script. Can complete all meetings in ~1-2 hours.

## Files

- `fetch_captions.py` — youtube-transcript-api based (blocked by IP ban)
- `fetch_captions_ytdlp.py` — yt-dlp based with rate limiting (NEW)
- `alternative_caption_methods.md` — this file
