#!/bin/bash
# Polish a raw Groq transcript into a structured, speaker-attributed document.
#
# Uses claude -p (non-interactive Claude Code CLI) in a two-pass approach:
#   Pass 1: Identify section boundaries from the transcript
#   Pass 2: Polish each section independently (parallelizable)
#
# Usage:
#   ./polish_transcript.sh <meeting_id>
#   ./polish_transcript.sh 11286    # the 10.5-hour budget hearing
#   ./polish_transcript.sh 125      # city council meeting
#
# Requirements:
#   - claude CLI (Claude Code)
#   - Raw transcript at whisper_experiments/transcripts/m{id}_*.txt
#   - Agenda at docs/{YYYYMMDD}/*Agenda*.pdf (optional but recommended)
#   - all_meetings.json for meeting metadata
#
# Output:
#   polished/m{id}_polished.md

set -uo pipefail

MEETING_ID="${1:?Usage: $0 <meeting_id>}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
POLISHED_DIR="$PROJECT_DIR/polished"
WORK_DIR="$PROJECT_DIR/polished/.work_m${MEETING_ID}"

mkdir -p "$POLISHED_DIR" "$WORK_DIR"

# --- Find files ---

TRANSCRIPT=$(ls "$PROJECT_DIR/whisper_experiments/transcripts/m${MEETING_ID}_"*.txt 2>/dev/null | head -1)
if [ -z "$TRANSCRIPT" ]; then
    echo "ERROR: No transcript found for meeting $MEETING_ID"
    exit 1
fi
echo "Transcript: $TRANSCRIPT"

META=$(ls "$PROJECT_DIR/whisper_experiments/transcripts/m${MEETING_ID}_"*.meta.json 2>/dev/null | head -1)

# Get meeting metadata
MEETING_JSON=$(python3 -c "
import json
data = json.load(open('$PROJECT_DIR/all_meetings.json'))
for year, meetings in data.items():
    for m in meetings:
        if m['id'] == $MEETING_ID:
            print(json.dumps(m))
            break
" 2>/dev/null)

MEETING_TITLE=$(echo "$MEETING_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['title'])")
MEETING_DATE=$(echo "$MEETING_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['dateTime'][:10])")
DATE_FOLDER=$(echo "$MEETING_DATE" | tr -d '-')

echo "Meeting: m${MEETING_ID} - ${MEETING_TITLE} (${MEETING_DATE})"

# Find agenda (PDF or HTML)
AGENDA_FILE=$(ls "$PROJECT_DIR/docs/${DATE_FOLDER}/"*"${MEETING_TITLE}"*"Agenda"*.pdf "$PROJECT_DIR/docs/${DATE_FOLDER}/"*"${MEETING_TITLE}"*"Agenda"*.html "$PROJECT_DIR/docs/${DATE_FOLDER}/"*"Agenda"*.pdf "$PROJECT_DIR/docs/${DATE_FOLDER}/"*"Agenda"*.html 2>/dev/null | head -1)
if [ -n "$AGENDA_FILE" ]; then
    echo "Agenda: $AGENDA_FILE"
else
    echo "No agenda found (will proceed without)"
fi

# --- Build roster context ---
# Determine the council roster based on the year
YEAR=$(echo "$MEETING_DATE" | cut -d- -f1)

cat > "$WORK_DIR/roster.txt" << 'ROSTER_EOF'
When attributing speakers, use the meeting context to identify them:
- The Chair/President calls the meeting to order and directs procedure
- The City Clerk calls roll, reads items, and announces votes
- "Madam CLA" / "CLA" = Chief Legislative Analyst (staff)
- "CAO" = City Administrative Officer (staff)
- General Managers present their department budgets
- Public commenters typically state their name at the start

Common transcription errors to fix:
- "Weasel/Weezar" = Huizar (Jose Huizar)
- "Rue/Ruth/Roo" = Ryu (David Ryu)
- "Renard" = Bernard (Bernard Parks)
- "Kretz" = Koretz (Paul Koretz)
- "Rosenthal" = Rosendahl (Bill Rosendahl)
- "Bonnen" = Bonin (Mike Bonin)
- "Krikorian" = Krekorian (Paul Krekorian)
- "Martinez" = Nury Martinez
ROSTER_EOF

# --- Determine transcript size and chunking strategy ---

TOTAL_LINES=$(wc -l < "$TRANSCRIPT")
TOTAL_CHARS=$(wc -c < "$TRANSCRIPT")
echo "Transcript: $TOTAL_LINES lines, $TOTAL_CHARS chars"

# Target ~40K chars per chunk (leaves room for prompt + output in context window)
CHUNK_SIZE=40000
NUM_CHUNKS=$(( (TOTAL_CHARS + CHUNK_SIZE - 1) / CHUNK_SIZE ))
if [ "$NUM_CHUNKS" -lt 2 ]; then
    NUM_CHUNKS=1
fi
LINES_PER_CHUNK=$(( (TOTAL_LINES + NUM_CHUNKS - 1) / NUM_CHUNKS ))

echo "Splitting into ~${NUM_CHUNKS} chunks of ~${LINES_PER_CHUNK} lines"

# ============================================================
# PASS 1: Split transcript at natural boundaries
# ============================================================

# Smart splitting: find timestamp lines near chunk boundaries and split there
python3 << SPLIT_EOF
import re

with open("$TRANSCRIPT") as f:
    lines = f.readlines()

total = len(lines)
target_chunk = $LINES_PER_CHUNK
chunks = []
start = 0

while start < total:
    end = min(start + target_chunk, total)

    # If not at the end, look for a good break point (large timestamp gap)
    if end < total:
        # Search backward from target end for a line with a timestamp gap > 5s
        best_break = end
        for i in range(end, max(start + target_chunk // 2, start + 10), -1):
            if i >= total:
                continue
            line = lines[i]
            prev_line = lines[i-1] if i > 0 else ""

            # Look for timestamp gaps (indicates topic/speaker change)
            ts_match = re.search(r'\[(\d+):(\d+):(\d+)\]', line)
            prev_ts = re.search(r'\[(\d+):(\d+):(\d+)\]', prev_line)

            if ts_match and prev_ts:
                t1 = int(prev_ts.group(1))*3600 + int(prev_ts.group(2))*60 + int(prev_ts.group(3))
                t2 = int(ts_match.group(1))*3600 + int(ts_match.group(2))*60 + int(ts_match.group(3))
                if t2 - t1 > 5:  # >5 second gap = likely topic break
                    best_break = i
                    break
        end = best_break

    chunks.append((start, end))
    start = end

# Write chunks
for i, (s, e) in enumerate(chunks):
    chunk_lines = lines[s:e]
    with open(f"$WORK_DIR/chunk_{i:03d}.txt", "w") as f:
        f.writelines(chunk_lines)

    # Write overlap context (last 5 lines of previous chunk for continuity)
    if i > 0:
        prev_s, prev_e = chunks[i-1]
        context = lines[max(prev_e-5, prev_s):prev_e]
        with open(f"$WORK_DIR/context_{i:03d}.txt", "w") as f:
            f.writelines(context)

print(f"Split into {len(chunks)} chunks")
for i, (s, e) in enumerate(chunks):
    first_ts = ""
    last_ts = ""
    for line in lines[s:e]:
        m = re.search(r'\[(\d+:\d+:\d+)\]', line)
        if m:
            if not first_ts:
                first_ts = m.group(1)
            last_ts = m.group(1)
    print(f"  chunk_{i:03d}: lines {s}-{e} ({e-s} lines) [{first_ts} - {last_ts}]")
SPLIT_EOF

# ============================================================
# PASS 2: Polish each chunk with claude -p
# ============================================================

CHUNK_FILES=($(ls "$WORK_DIR"/chunk_*.txt | sort))
TOTAL_CHUNKS=${#CHUNK_FILES[@]}

echo ""
echo "=== PASS 2: Polishing $TOTAL_CHUNKS chunks ==="

# Build the base prompt
cat > "$WORK_DIR/prompt_template.txt" << PROMPT_EOF
You are polishing a raw machine-generated transcript of a Los Angeles City Council meeting.

MEETING: ${MEETING_TITLE}
DATE: ${MEETING_DATE}
MEETING ID: m${MEETING_ID}

$(cat "$WORK_DIR/roster.txt")

YOUR TASK:
1. Add speaker attribution (e.g., "**Chair Parks:**", "**Council Member Rosendahl:**", "**CAO Staff:**")
2. Fix transcription errors (names, acronyms, LA city terminology)
3. Organize into subsections by topic with ### headers
4. Clean up run-on sentences and false starts
5. Strip any pre-meeting broadcast content (TV segments, "LA This Week", etc.) — just note it as *[Pre-meeting broadcast]*
6. Preserve all substantive content — do NOT summarize or skip anything said in the meeting
7. Keep timestamps at major transitions [HH:MM:SS]
8. Use markdown formatting

If this is the start of the meeting, include a header with meeting info and attendees.
If this is a continuation, just continue the polished transcript naturally.

Output ONLY the polished transcript section. No preamble, no "here is the polished version" — just the content.
PROMPT_EOF

# Prepare all prompts first (fast, sequential)
for i in "${!CHUNK_FILES[@]}"; do
    CHUNK="${CHUNK_FILES[$i]}"
    CHUNK_NUM=$(printf "%03d" $i)

    CONTEXT=""
    if [ -f "$WORK_DIR/context_${CHUNK_NUM}.txt" ]; then
        CONTEXT="

CONTEXT (last few lines from previous section for continuity):
$(cat "$WORK_DIR/context_${CHUNK_NUM}.txt")"
    fi

    CHUNK_POSITION=""
    if [ "$i" -eq 0 ]; then
        CHUNK_POSITION="This is the BEGINNING of the meeting."
    elif [ "$i" -eq $((TOTAL_CHUNKS - 1)) ]; then
        CHUNK_POSITION="This is the END of the meeting."
    else
        CHUNK_POSITION="This is a MIDDLE section of the meeting (chunk $((i+1)) of $TOTAL_CHUNKS)."
    fi

    FULL_PROMPT="$WORK_DIR/full_prompt_${CHUNK_NUM}.txt"
    cat > "$FULL_PROMPT" << CPEOF
$(cat "$WORK_DIR/prompt_template.txt")

$CHUNK_POSITION
$CONTEXT

RAW TRANSCRIPT TO POLISH:

$(cat "$CHUNK")
CPEOF
done

echo "  Prepared $TOTAL_CHUNKS prompts. Launching parallel claude -p calls..."

# Write a worker script that each parallel job will execute
cat > "$WORK_DIR/run_chunk.sh" << 'WORKER_EOF'
#!/bin/bash
CHUNK_NUM="$1"
WORK_DIR="$2"
PROMPT_FILE="$WORK_DIR/full_prompt_${CHUNK_NUM}.txt"
OUTPUT="$WORK_DIR/polished_${CHUNK_NUM}.md"

if [ -f "$OUTPUT" ] && [ -s "$OUTPUT" ]; then
    echo "  Chunk $CHUNK_NUM: already done, skipping"
    exit 0
fi

# Pipe prompt via stdin to avoid shell argument length limits
cat "$PROMPT_FILE" | claude -p - --model sonnet > "$OUTPUT" 2>"$WORK_DIR/err_${CHUNK_NUM}.log" || true

if [ -s "$OUTPUT" ]; then
    echo "  Chunk $CHUNK_NUM: done ($(wc -c < "$OUTPUT" | tr -d ' ') chars)"
else
    echo "  Chunk $CHUNK_NUM: WARNING empty output (see err_${CHUNK_NUM}.log)"
fi
WORKER_EOF
chmod +x "$WORK_DIR/run_chunk.sh"

# Run all chunks in parallel (up to 8 at a time)
MAX_PARALLEL=${MAX_PARALLEL:-4}
echo "  Running $TOTAL_CHUNKS chunks with $MAX_PARALLEL parallel workers..."

ls "$WORK_DIR"/full_prompt_*.txt | sort | sed 's/.*full_prompt_//' | sed 's/\.txt//' | \
    xargs -P "$MAX_PARALLEL" -I {} bash "$WORK_DIR/run_chunk.sh" {} "$WORK_DIR"

echo "  All chunks processed."

# Report results
DONE_COUNT=$(find "$WORK_DIR" -name "polished_*.md" -size +0c | wc -l | tr -d ' ')
FAIL_COUNT=$(find "$WORK_DIR" -name "polished_*.md" -size 0c | wc -l | tr -d ' ')
echo "  Results: $DONE_COUNT succeeded, $FAIL_COUNT empty"

# ============================================================
# CONCATENATE
# ============================================================

echo ""
echo "=== Concatenating polished chunks ==="

FINAL="$POLISHED_DIR/m${MEETING_ID}_polished.md"

cat > "$FINAL" << HEADER_EOF
# ${MEETING_TITLE}
## ${MEETING_DATE}
**Meeting ID:** m${MEETING_ID}

---

HEADER_EOF

for f in "$WORK_DIR"/polished_*.md; do
    cat "$f" >> "$FINAL"
    echo "" >> "$FINAL"
    echo "---" >> "$FINAL"
    echo "" >> "$FINAL"
done

echo "Done: $FINAL"
echo "Size: $(wc -c < "$FINAL" | tr -d ' ') chars, $(wc -l < "$FINAL" | tr -d ' ') lines"

# Cleanup work dir (keep for debugging)
echo "Work files in: $WORK_DIR"
