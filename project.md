# LA City Council Meeting Audio Extraction & Analysis Plan

## Objective

I want to build a comprehensive database of all Los Angeles city council + committee discussions by combining the agenda notes + audio transcripts, creating an data pipeline that will store relevant files in a vector database for later querying. Agenda notes are available as text. You will need to build teh pipeline to extract audio from LA City Council and committee meeting videos on YouTube, process with Gemini API to generate structured transcripts and housing policy analysis, at ~$0.10-0.35 per 3-hour meeting.

---

## 0. Base documents

Please see the claud.md file for how to pull document data from city council meetings. 

## 1. Video Sources

### YouTube Channel
- **Channel:** youtube.com/LACityClerk
- **Content:** Live and archived City Council meetings, committee meetings
- **Schedule:** Council meets Tuesdays, Wednesdays, and Fridays at 10:00 AM PT


### Supplementary Data Sources
- **Agendas (PrimeGov):** lacity.primegov.com - agenda items with council file numbers. Use to identify which meetings had housing-related items on the agenda before processing audio.
- **Council File Management System (CFMS):** cityclerk.lacity.org/lacityclerkconnect - vote records, motions, ordinances. Search by council file number.
- **LADBS Open Data:** data.lacity.org - building permits (leading indicator for construction pipeline).
- **Granicus (legacy):** lacity.granicus.com/ViewPublisher.php?view_id=129 - has CART transcripts from 2016-2025, rough quality but useful for cross-referencing. PLUM committee transcripts at view_id=46.

---

## 2. Audio Download Pipeline

### Prerequisites
```bash
pip install yt-dlp
pip install google-genai
```

### Step 1: List available meeting videos
```bash
# List all videos from the LACityClerk channel
yt-dlp --flat-playlist --print "%(id)s %(title)s %(upload_date)s" \
  "https://www.youtube.com/@LACityClerk/videos" > meeting_list.txt

# Or search for specific committee meetings
yt-dlp --flat-playlist --print "%(id)s %(title)s %(upload_date)s" \
  "https://www.youtube.com/@LACityClerk/search?query=PLUM+Committee" > plum_meetings.txt
```

### Step 2: Download audio only
```bash
# Download audio only (no video), convert to mp3
# This avoids downloading large video files entirely
yt-dlp -x --audio-format mp3 --audio-quality 5 \
  -o "%(upload_date)s_%(title)s.%(ext)s" \
  "https://www.youtube.com/watch?v=VIDEO_ID_HERE"

# Batch download from a list of URLs
yt-dlp -x --audio-format mp3 --audio-quality 5 \
  -o "%(upload_date)s_%(title)s.%(ext)s" \
  -a meeting_urls.txt
```

**Audio quality notes:**
- Quality 5 (~128kbps) is sufficient for speech. No need for higher quality.
- A 3-hour meeting at 128kbps is roughly 170MB as mp3.
- Lower quality (e.g., quality 9, ~64kbps) may work fine and halve file size.

### Step 3: Verify downloads
```bash
# Check duration and file size of downloaded audio
for f in *.mp3; do
  echo "$f: $(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$f" | \
    awk '{printf "%d:%02d:%02d", $1/3600, ($1%3600)/60, $1%60}') \
    $(du -h "$f" | cut -f1)"
done
```

---

## 3. Gemini API Processing

### Approach: Upload audio via Files API, then generate content

The Files API handles files >20MB (most council meetings will exceed this). Uploaded files are stored for 48 hours.

Gemini API key is under my environmental variables as $GEMINI_API_KEY.

### Python Script: process_meeting.py

```python
import os
import json
import time
from google import genai
from google.genai import types

# Initialize client (set GOOGLE_API_KEY env var)
client = genai.Client()

# Model selection:
# - gemini-2.5-flash-lite: cheapest (~$0.10/3hr meeting)
# - gemini-2.5-flash: better quality (~$0.35/3hr meeting)  
# - gemini-3-flash-preview: latest, good balance (~$0.35/3hr meeting)
MODEL = "gemini-2.5-flash"

SYSTEM_PROMPT = """You are an expert analyst of Los Angeles City Council 
and committee meetings. Your task is to process the audio of a meeting 
and extract structured information.

For each agenda item discussed, extract:
1. The council file number if mentioned (format: XX-XXXX)
2. The topic/subject
3. A summary of the discussion (2-4 sentences)
4. Key speakers and their positions (council members, staff, public commenters)
5. Any votes taken and results
6. Timestamps (MM:SS format) for when discussion of each item begins and ends

Pay special attention to items related to:
- Housing development, zoning changes, density
- Building permits and construction
- Affordable housing requirements
- Homelessness programs (Inside Safe, etc.)
- Executive Order No. 1 (EO1) streamlining
- CEQA exemptions for housing
- Any mention of RHNA, housing element, or housing production targets

Output your analysis as JSON with the following structure:
{
  "meeting_date": "YYYY-MM-DD",
  "meeting_type": "City Council | PLUM Committee | Housing Committee | etc.",
  "duration_minutes": 180,
  "items_discussed": [
    {
      "council_file": "XX-XXXX or null",
      "topic": "Brief topic description",
      "summary": "2-4 sentence summary of discussion",
      "speakers": [
        {
          "name": "Council Member Name",
          "role": "Council Member | Staff | Public Commenter",
          "position": "Support | Oppose | Neutral | N/A",
          "key_quotes_paraphrased": "What they argued"
        }
      ],
      "vote": {
        "result": "Passed | Failed | Tabled | No Vote",
        "ayes": 0,
        "nays": 0,
        "abstentions": 0
      },
      "timestamp_start": "MM:SS",
      "timestamp_end": "MM:SS",
      "housing_relevant": true,
      "housing_tags": ["zoning", "affordable", "permits", "density", "EO1"]
    }
  ],
  "housing_summary": "Overall summary of housing-related activity in this meeting"
}

Respond ONLY with valid JSON. No markdown fences, no preamble."""


def upload_and_process(audio_path: str) -> dict:
    """Upload audio file and process with Gemini."""
    
    print(f"Uploading {audio_path}...")
    uploaded_file = client.files.upload(file=audio_path)
    
    # Wait for file to be processed
    while uploaded_file.state.name == "PROCESSING":
        print("  Waiting for processing...")
        time.sleep(5)
        uploaded_file = client.files.get(name=uploaded_file.name)
    
    if uploaded_file.state.name == "FAILED":
        raise Exception(f"File processing failed: {uploaded_file.state}")
    
    print(f"  File ready. Generating analysis...")
    
    response = client.models.generate_content(
        model=MODEL,
        contents=[
            uploaded_file,
            SYSTEM_PROMPT
        ],
        config=types.GenerateContentConfig(
            temperature=0.1,  # Low temperature for factual extraction
            max_output_tokens=8192,
        )
    )
    
    # Parse JSON response
    text = response.text.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    
    result = json.loads(text)
    
    # Clean up uploaded file
    client.files.delete(name=uploaded_file.name)
    
    return result


def process_batch(audio_dir: str, output_dir: str):
    """Process all audio files in a directory."""
    os.makedirs(output_dir, exist_ok=True)
    
    audio_files = sorted([
        f for f in os.listdir(audio_dir) 
        if f.endswith(('.mp3', '.wav', '.m4a', '.ogg'))
    ])
    
    for audio_file in audio_files:
        output_file = os.path.join(
            output_dir, 
            audio_file.rsplit('.', 1)[0] + '.json'
        )
        
        # Skip if already processed
        if os.path.exists(output_file):
            print(f"Skipping {audio_file} (already processed)")
            continue
        
        try:
            result = upload_and_process(os.path.join(audio_dir, audio_file))
            
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)
            
            print(f"  Saved to {output_file}")
            
            # Rate limiting: wait between requests
            time.sleep(2)
            
        except Exception as e:
            print(f"  ERROR processing {audio_file}: {e}")
            continue


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) == 2:
        # Single file mode
        result = upload_and_process(sys.argv[1])
        print(json.dumps(result, indent=2))
    elif len(sys.argv) == 3:
        # Batch mode
        process_batch(sys.argv[1], sys.argv[2])
    else:
        print("Usage:")
        print("  python process_meeting.py <audio_file>")
        print("  python process_meeting.py <audio_dir> <output_dir>")
```

---

## 4. Cost Estimates

### Per meeting (3 hours / 10,800 seconds)

Audio tokenization: ~32 tokens/second = ~346K input tokens per meeting.

| Model | Audio Input Rate | Cost/Meeting | Notes |
|-------|-----------------|-------------|-------|
| 2.5 Flash-Lite | $0.30/1M tokens | ~$0.10 | Cheapest, may miss nuance |
| 2.5 Flash | $1.00/1M tokens | ~$0.35 | Good balance |
| 3 Flash Preview | $1.00/1M tokens | ~$0.35 | Latest model |
| Batch API (any) | 50% discount | ~$0.05-0.17 | 24hr turnaround |

Output tokens for the JSON summary are negligible (~$0.01-0.03).

### At scale
- Council meets ~3x/week, ~150 meetings/year
- PLUM meets 2x/month, ~24 meetings/year
- Housing Committee meets 2x/month, ~24 meetings/year
- **Total: ~200 meetings/year**
- **Estimated annual cost: $20-70** (depending on model and batch usage)

### Free tier option
- YouTube URL feature is currently free (preview)
- 8 hours/day limit on free tier = 2-3 meetings/day
- Downside: processes video frames too (higher token count, no cost savings while free, but costs more when pricing kicks in)

---

## 5. End-to-End Workflow

### One-time setup
```bash
# 1. Install dependencies
pip install yt-dlp google-genai

# 2. Get Gemini API key from https://aistudio.google.com/apikey
export GOOGLE_API_KEY="your-key-here"

# 3. Create project directories
mkdir -p la_council/{audio,output,scripts}
```

### Ongoing workflow

```bash
# 1. Check PrimeGov for upcoming meetings with housing items
#    https://lacity.primegov.com
#    Note council file numbers for housing-related items

# 2. After meeting occurs, find the YouTube video
#    https://www.youtube.com/@LACityClerk/videos

# 3. Download audio
yt-dlp -x --audio-format mp3 --audio-quality 5 \
  -o "la_council/audio/%(upload_date)s_%(title)s.%(ext)s" \
  "https://www.youtube.com/watch?v=VIDEO_ID"

# 4. Process with Gemini
python la_council/scripts/process_meeting.py \
  la_council/audio/ la_council/output/

# 5. Filter for housing-relevant items
python -c "
import json, glob
for f in sorted(glob.glob('la_council/output/*.json')):
    data = json.load(open(f))
    housing = [i for i in data['items_discussed'] if i.get('housing_relevant')]
    if housing:
        print(f'\n=== {data[\"meeting_date\"]} - {data[\"meeting_type\"]} ===')
        for item in housing:
            print(f'  [{item[\"council_file\"]}] {item[\"topic\"]}')
            print(f'    {item[\"summary\"]}')
            if item.get('vote', {}).get('result'):
                print(f'    Vote: {item[\"vote\"][\"result\"]}')
"
```

### Optional: Automate with a cron job or Airflow DAG

Since you're already working with Airflow at Credible, you could set up a DAG that:
1. Scrapes the LACityClerk YouTube channel for new uploads
2. Downloads audio for meetings matching keywords (PLUM, Housing, Council)
3. Uploads to Gemini and processes
4. Stores structured JSON output (could go to Snowflake)
5. Alerts you when housing-relevant items are detected

---

## 6. Tips for Prompt Engineering

### For long meetings, consider chunking
If a meeting exceeds the model's context window (unlikely with audio at 32 tokens/sec, since 3 hours = ~346K tokens, well within the 1M limit), you can split:
```bash
# Split audio into 1-hour chunks
ffmpeg -i meeting.mp3 -f segment -segment_time 3600 -c copy chunk_%03d.mp3
```

### Improve speaker identification
Add known council member names to the system prompt:
```
Current LA City Council members (as of early 2026):
- Eunisses Hernandez (CD1)
- Paul Krekorian (CD2)
- Bob Blumenfield (CD3, President Pro Tempore)
- Nithya Raman (CD4, Asst. President Pro Tempore)
- Katy Yaroslavsky (CD5)
- Imelda Padilla (CD6)
- Monica Rodriguez (CD7)
- Marqueece Harris-Dawson (CD8, Council President)
- Curren Price (CD9)
- Heather Hutt (CD10)
- Traci Park (CD11)
- John Lee (CD12)
- Hugo Soto-Martinez (CD13)
- Kevin de León (CD14)
- Tim McOsker (CD15)
```
Note: 8 of 15 seats are up for election June 2, 2026. Verify roster
after election as members may change.

### Cross-reference with CFMS
After extraction, use council file numbers to look up full documentation:
```
https://cityclerk.lacity.org/lacityclerkconnect/index.cfm?fa=ccfi.viewrecord&cfnumber=XX-XXXX
```

---

## 7. Limitations and Caveats

- **Speaker attribution is imperfect.** Gemini infers speakers from context (e.g., "Councilmember Park?"). It will not always get this right, especially during rapid back-and-forth or public comment periods.
- **Audio quality varies.** Some committee meetings have poor microphone audio, especially for public commenters. This may affect transcription accuracy.
- **Not a legal record.** The official record is the Council Journal published by the City Clerk. Use this for research and analysis, not legal citation.
- **Gemini may hallucinate.** Always cross-reference key claims (vote counts, council file numbers) against CFMS records.
- **YouTube availability.** Not all committee meetings may be uploaded. If a meeting is missing from YouTube, check the Granicus archive or clerk.lacity.org/calendar for audio.