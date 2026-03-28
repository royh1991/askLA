"""
Gemini prompt v2 for cleaning LA City Council/Committee CART captions.

Based on analysis of 20 full meeting transcripts across all meeting types.
"""

PROMPT_V2 = """\
You are processing raw CART (Computer-Aided Real-Time Translation) captions from a Los Angeles City Council or committee meeting. You have two inputs:

1. **AGENDA** — the official meeting agenda listing items, council file numbers, and descriptions.
2. **TRANSCRIPT** — raw YouTube closed captions produced by a live CART captioner. These contain fragmented 3-6 word lines, no paragraph breaks, systematic typos, and (in committee meetings) no speaker identification.

Your task: produce a clean, structured JSON transcript organized by meeting section. This will be used for search and retrieval in a vector database.

---

## UNDERSTANDING THE TWO CAPTION SYSTEMS

LA City meetings use two different captioning styles depending on meeting type:

**Full Council meetings** (City Council Meeting): ALL CAPS with speaker labels like `>> Council President:`, `>> H. Hutt:`, `>> Clerk:`, `>> Speaker:`, `>> Interpreter:`. These start with 18-49 minutes of a pre-roll video broadcast ("LA This Week") in lowercase before the actual meeting.

**Committee meetings** (PLUM, Budget, Housing, etc.): Lowercase/sentence case with NO speaker labels at all. You must infer speakers from context. No pre-roll video.

**Commissions** (Health Commission, etc.): Similar to committees but more informal — voice votes instead of roll calls, workshop-style discussion.

Detect which type this is and handle accordingly.

---

## OUTPUT FORMAT

Return valid JSON:

```json
{
  "meeting_id": <number>,
  "date": "YYYY-MM-DD",
  "title": "Meeting name",
  "meeting_type": "city_council | committee | commission | special",
  "sections": [
    {
      "section_type": "pre_roll | roll_call | consent_calendar | presentation | public_comment_period | agenda_item | closed_session | procedural | adjournment",
      "title": "Brief descriptive title for this section",
      "agenda_items_covered": [3, 4, 5],
      "council_files": ["25-0874", "26-0155"],
      "speakers": [
        {
          "name": "Councilmember Yaroslavsky",
          "role": "Committee Chair | Council Member | City Staff | Public Commenter | City Clerk | City Attorney | Interpreter | Unknown",
          "affiliation": "CD5" or "Department of Transportation" or "Better Neighbors LA" or null
        }
      ],
      "votes": [
        {
          "items": [1, 3, 4, 5],
          "result": "Passed | Failed | Tabled | Continued",
          "tally": "15-0" or "9-4" or "Unanimous (3-0)" or "Voice vote",
          "notes": "as amended" or null
        }
      ],
      "clean_transcript": "Full cleaned text with speaker labels and paragraph breaks."
    }
  ]
}
```

---

## SECTION TYPES AND HOW TO IDENTIFY THEM

### pre_roll
Only in full Council meetings. Lowercase text before the ALL CAPS meeting begins. Covers LA city news segments. The transition is often garbled (lowercase bleeding into CAPS). Detect by: shift to ALL CAPS + appearance of `>> Council President:` + "GOOD MORNING AND WELCOME TO THE REGULARLY SCHEDULED MEETING." Summarize the pre-roll briefly — do not transcribe it fully.

### roll_call
Clerk calls each member by name; they respond "present," "here," or mark as absent. Clerk announces quorum. Format as a clean list.

### consent_calendar
Chair proposes items for consent vote. Members may "call special" (pull items for separate discussion). Bulk vote on remaining items. Note which items were voted together and the tally.

### presentation
Council meetings have lengthy commendatory resolutions, recognitions, and celebrations (30-90 minutes). Committee meetings may have staff presentations on agenda items. Tag with descriptive title.

### public_comment_period
**CRITICAL: This is ONE section, not split by agenda item.** Public commenters get 1-3 minutes and routinely address multiple items in a single turn. Structure each speaker as a sub-block within the section:

```
[Public Speaker - Maria Ponce]: Items 1, 4, 5 and general.
[text of their comment]

[Public Speaker - Rob Kwan]: Items 6-9 and general.
[text of their comment]
```

Include the City Attorney's time management, warnings, and the clerk's name-calling batches. Note when speakers are cut off, warned for being off-topic, or give interpreted testimony.

### agenda_item
Individual item discussion: clerk reads the item, staff presents, committee discusses, vote taken. One section per item (or group of related items heard together).

### closed_session
Read into the record with settlement amounts. Brief.

### procedural
Approval of minutes, recess/reconvene, posting motions, adjourning motions (in memoriam tributes). Also: when a regular meeting recesses to convene a special meeting (separate roll call, separate public comment rules), mark this as a procedural transition.

### adjournment
"The desk is clear" / "We are adjourned."

---

## SPEAKER IDENTIFICATION

### In Council meetings (ALL CAPS with labels):
Map abbreviations to full names:
- `>> Council President:` → Council President Harris-Dawson
- `>> Clerk:` → City Clerk
- `>> City Attorney:` → City Attorney
- `>> H. Hutt:` → Councilmember Hutt (CD10)
- `>> B. Blumenfield:` → Councilmember Blumenfield (CD3)
- `>> Speaker:` → identify from context (name stated, or "Unknown Speaker")
- `>> Interpreter:` → Interpreter

### In Committee meetings (no labels):
Infer speakers from:
- **Self-identification**: "My name is Kevin Keller with City Planning"
- **Chair addressing someone**: "Miss Rosales, would you please call the roll"
- **Role cues**: Clerk reads item text. Chair says "Colleagues, any questions?"
- **Procedural pattern**: After "public comment on this item is closed," the next voice is a committee member
- When uncertain, use [Unknown Speaker] — do NOT guess.

### Current Council Members (2025-2026):
- Eunisses Hernandez (CD1), Paul Krekorian (CD2), Bob Blumenfield (CD3)
- Nithya Raman (CD4), Katy Yaroslavsky (CD5), Imelda Padilla (CD6/7)
- Monica Rodriguez (CD7), Marqueece Harris-Dawson (CD8, Council President)
- Curren Price (CD9), Heather Hutt (CD10), Traci Park (CD11)
- John Lee (CD12), Hugo Soto-Martinez (CD13), Ysabel Jurado (CD14)
- Tim McOsker (CD15)

---

## CART ERROR CORRECTION

### Garbled Council Member Names:
- "I CAN'T ROZ SKI" / "YAROSLAVSKY" → Yaroslavsky
- "JAOUR DO" / "JAOT" → Jurado
- "McOFFINGER" → McOsker
- "Gerardo" / "Hirano" → Jurado (CART renders unfamiliar names as common ones)
- "Roselle" / "Rosales" → Rosales (clerk)
- "li" → Lee (in roll call)

### Garbled Acronyms and Technical Terms:
- "LAHSA" is correct; "Lhasa" → LAHSA (LA Homeless Services Authority)
- "sequel" / "sequel a" → CEQA (California Environmental Quality Act)
- "five eyes" / "three eyes" → "five ayes" / "three ayes"
- "SCIU" → SEIU (Service Employees union)
- "EDEBSTA" / "A DEBSACA" → IDEPSCA
- "BTEX" → BTEX (never "Beatles"); "xylene" (never "cylinder"); "toluene" (never "totaling")
- "TLS" / "Tl's" → TLS (Time Limited Subsidy)
- "HMIS" / "miss" → HMIS (Homeless Management Information System)
- "COC" / "Cocc" → COC (Continuum of Care)
- "Eula" / "Ulla" → ULA (United to House LA)
- "tours" / "TORS" → TORS (Transient Occupancy Residential Structure)
- "Besford" / "Biz Ford" → BizFed (LA County Business Federation)
- "d o t" / "D, O, t" → DOT or LADOT
- "CEO" in LA City context = City Administrative Officer (CAO), not a corporate CEO

### Stenographic Artifacts (Council meetings):
- `*F`, `ER` at line start, random `?` → remove
- Double dashes `--` indicate real-time corrections: use the final version
- "SPSHZ" → "specials", "NEKTS" → "next", "KONLT" → "comment"
- Portmanteau errors: "HOST THISING" → "hosting this", "APPROVE AWFUL" → "approval of"

### Encoding Artifacts:
- "ft■!S" → "square feet"
- "yd■!T" → "cubic yards"

### Council File Numbers:
- "2508 74S3" → "25-0874-S3"
- "Lacouncilfile" → "LA Council File"

---

## SPANISH-LANGUAGE CONTENT

Some speakers testify in Spanish with consecutive interpretation. The CART captioner garbles the Spanish (they're an English captioner). Format as:

```
[Public Speaker - Name] (via interpreter): [English interpretation text]
```

Preserve the English interpretation as authoritative. Do not try to fix the garbled Spanish.

---

## CRITICAL RULES

1. **Every part of the transcript must appear in exactly one section.** Do not skip content.
2. **Public comment is ONE section** — do not split it across agenda items. Speakers address multiple items; tag which items each speaker references.
3. **Fix typos and merge fragments** into proper sentences. Convert ALL CAPS to sentence case. Add punctuation.
4. **Stay faithful** — fix CART garbles but do not rephrase, summarize, or add content. Preserve profanity and heated language verbatim (these are public records).
5. **Pre-roll video**: In Council meetings, summarize briefly as one section. Do not transcribe the full 20-49 minute broadcast.
6. **Votes**: Capture exact tallies, items covered, and whether "as amended."
7. **Dual meetings**: If the meeting recesses the regular meeting to convene a special meeting, mark the transition clearly as a procedural section.
8. **Preserve [APPLAUSE], [MUSIC], [SPEAKING SPANISH]** stage directions.
9. **When uncertain about a name or word**, use the garbled text in brackets with [?] rather than guessing wrong.

Now process this meeting:
"""
