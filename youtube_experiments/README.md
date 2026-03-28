# YouTube Transcript Extraction Experiments

Comparing YouTube caption extraction methods against Groq Whisper transcription
for LA City Council meeting m125 (2019-02-13, video `e1hxtQRUGyo`).

## Methods Tested

| Method | Library | Works? | Output |
|--------|---------|--------|--------|
| 1. youtube-transcript-api | `pip install youtube-transcript-api` | Yes | `method1_correct_video.txt` |
| 2a. yt-dlp (SRT) | `yt-dlp --write-auto-subs --sub-format srt` | Yes | `correct_ytdlp_e1hxtQRUGyo.en.srt` |
| 2b. yt-dlp (json3) | `yt-dlp --write-auto-subs --sub-format json3` | Yes | `correct_ytdlp_json3_e1hxtQRUGyo.en.json3` |
| 3. Direct timedtext scrape | Raw requests to YouTube page | Failed | URL signing issues |

All three working methods produce **identical word-for-word output** (same 2,218 segments, 12,227 words).
They all pull from the same underlying YouTube ASR caption track.

## Key Findings

### 1. YouTube captions are FREE and instant
No API key, no audio download, no processing time. ~1 second per video.

### 2. Word count is comparable
- Groq Whisper: 11,850 words (125 min coverage)
- YouTube auto-captions: 12,227 words (144 min coverage)

### 3. Quality differences

| Aspect | Groq Whisper | YouTube Auto-Captions |
|--------|-------------|----------------------|
| Capitalization | Proper (names, places) | All lowercase |
| Punctuation | Full (periods, commas) | Almost none (57 marks vs 1,404) |
| Readability | Sentence-like segments | 2-4 word fragments |
| Accuracy | High, but 6.5% truncated lines | High, no truncation |
| Speaker names | Preserved | Preserved (lowercase) |
| Music/silence | Transcribed as words sometimes | `[Music]` tags |

### 4. Groq has truncation artifacts
6.5% of Groq lines are cut mid-word (e.g., "David Hockney valued at 3", "and don't adjust your tele").
YouTube captions capture this content fully: "david hockney valued at 350 thousand dollars",
"and don't adjust your television sets".

### 5. Timestamp drift
YouTube video is 19 minutes longer than the Groq audio source. Drift grows over time:
- 0-10 min: +3 to +10s
- 30 min: +48 to +59s
- 120+ min: +1142s (19 min!)

This suggests the YouTube video includes pre-roll/post-roll content or breaks
that were trimmed from the downloaded audio file.

## Recommendation

Use `youtube-transcript-api` as a **free first pass** for all meetings with video URLs.
It's the simplest method (3 lines of Python, no cookies/deno needed).

```python
from youtube_transcript_api import YouTubeTranscriptApi
ytt_api = YouTubeTranscriptApi()
transcript = ytt_api.fetch(VIDEO_ID, languages=["en"])
```

Then use Groq Whisper only for:
- Meetings without YouTube captions
- Cases where higher formatting quality is needed (capitalization, punctuation)
- Meetings where you need precise timestamps aligned to the audio file

## Files

- `method1_transcript_api.py` — youtube-transcript-api extraction
- `method2_ytdlp_subs.py` — yt-dlp subtitle extraction
- `method3_direct_scrape.py` — direct timedtext API (failed)
- `compare_correct.py` — comparison script
- `method1_correct_video.txt` — extracted transcript (correct video)
- `correct_ytdlp_*.srt/json3` — yt-dlp output files
