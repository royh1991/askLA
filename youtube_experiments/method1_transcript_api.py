"""Method 1: youtube-transcript-api library"""
import json
from youtube_transcript_api import YouTubeTranscriptApi

VIDEO_ID = "K30xYEKTDVk"
OUTPUT_DIR = "/Users/royhu/Documents/projects/askLA/youtube_experiments"

def main():
    ytt_api = YouTubeTranscriptApi()

    # List available transcripts
    transcript_list = ytt_api.list(VIDEO_ID)
    print("Available transcripts:")
    for t in transcript_list:
        print(f"  Language: {t.language}, Code: {t.language_code}, "
              f"Generated: {t.is_generated}, Translatable: {t.is_translatable}")

    # Fetch English transcript
    transcript = ytt_api.fetch(VIDEO_ID, languages=["en"])

    # Save as JSON (with timestamps)
    entries = []
    for snippet in transcript:
        entries.append({
            "start": snippet.start,
            "duration": snippet.duration,
            "text": snippet.text,
        })

    with open(f"{OUTPUT_DIR}/method1_transcript_api.json", "w") as f:
        json.dump(entries, f, indent=2)

    # Save as plain text (with timestamps, matching Groq format)
    with open(f"{OUTPUT_DIR}/method1_transcript_api.txt", "w") as f:
        for e in entries:
            hours = int(e["start"] // 3600)
            minutes = int((e["start"] % 3600) // 60)
            seconds = int(e["start"] % 60)
            timestamp = f"[{hours:02d}:{minutes:02d}:{seconds:02d}]"
            f.write(f"{timestamp} {e['text']}\n")

    print(f"\nSaved {len(entries)} segments")
    print(f"Total duration: {entries[-1]['start']:.0f}s")
    print(f"\nFirst 10 lines:")
    for e in entries[:10]:
        hours = int(e["start"] // 3600)
        minutes = int((e["start"] % 3600) // 60)
        seconds = int(e["start"] % 60)
        print(f"  [{hours:02d}:{minutes:02d}:{seconds:02d}] {e['text']}")

if __name__ == "__main__":
    main()
