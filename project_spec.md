# askLA — Product Specification

## Vision

**askLA is a civic intelligence platform for Los Angeles.** It transforms 18 years of city council proceedings — 10,000+ meetings, millions of words of testimony, thousands of votes — into a searchable, understandable, actionable public resource.

The platform serves a spectrum from a resident who has never attended a council meeting to a civil rights attorney building a federal case. The same underlying data powers every experience; the interface adapts to the user.

**One-liner:** The city's memory, made accessible.

---

## Aesthetic Direction

**Reference sites**: [cabagges.world](https://cabagges.world/) for warmth, editorial quality, organic personality. [trychroma.com](https://www.trychroma.com/) for the selective terminal aesthetic in data/diagrams. askLA lives in between: **a beautifully art-directed civic magazine with a retro-terminal soul in its data layer.**

The warmth and generosity comes from Cabbages — the cream backgrounds, the breathing room, the rounded images, the sense that someone who cares designed this. The technical personality comes from Chroma — the bracket-prefixed section headers, the monospace data presentation, the ASCII-flavored diagrams, the code-as-content confidence. The mascot and animations add the playful layer that neither reference has.

**The vibe: warm and inviting on the surface, terminal-precise in the data, playful throughout.** City government is dry enough — the tool that makes it accessible should have the warmth of a neighborhood restaurant and the rigor of a research database.

### Visual Language

- **Typography — three layers**:
  - *Display/brand*: A custom or distinctive display face for the "askLA" wordmark and section heroes — something with the organic, characterful weight of the Cabbages wordmark. Thick, rounded, memorable. Not a pixel font for the logo — something warm and bold.
  - *Body/UI*: A clean, highly legible sans-serif (Inter, Geist) for navigation, summaries, plain-language text. Generous line height. This is the Cabbages layer — editorial, readable, inviting.
  - *Data/terminal*: Monospace (JetBrains Mono, IBM Plex Mono) for transcript excerpts, vote tallies, council file numbers, search results, speaker names, and anything that came from the public record. The Chroma layer. When you see monospace, you know you're looking at *source data*.

- **Color palette**:
  - *Base*: Warm cream/off-white background (Cabbages' #F5F1EB range). Not white. Not gray. Warm paper.
  - *Primary accent*: A rich, saturated green — civic and organic. Inspired by both the Cabbages forest green and LA's city seal. Used for links, active states, the mascot, and key CTAs.
  - *Secondary*: Soft sage/olive for backgrounds on callout cards, the newsletter/alert signup, filter pills. The quiet green.
  - *Dark sections*: Select sections flip to near-black background with light text (Chroma's bottom-half treatment). Used for the data-dense views: vote matrices, coalition maps, transcript deep-dives. Creates rhythm and signals "you're in the data now."
  - *Status*: Green (passed/aye), warm red (failed/nay), amber (pending/abstain). High contrast on both light and dark backgrounds.
  - *Restraint*: Like Cabbages, the palette is narrow. Cream + green + dark. No color noise. The restraint makes the data colors pop.

- **Layout**:
  - *Generous space*: Things breathe. Content doesn't touch the edges. Images and cards have real margins between them. The Cabbages approach — you earn density when you need it (data tables, vote grids), but the default is air.
  - *Rounded corners*: Meaningful radius on images, cards, buttons, filter pills (12-16px). Not circles, not sharp — the Cabbages radius. Warm, not clinical.
  - *Bordered panels for data*: When presenting structured data (transcripts, vote records, timelines), use Chroma-style panels with visible 1-2px borders and bracket-prefixed headers: `[■] Votes`, `[>] Transcript`, `[◆] Public Comment`. This typographic device is the site's retro signature.
  - *Float and contrast*: Product-style presentation from Cabbages — entity cards (council members, council files, meetings) float on the cream background with subtle shadow, like objects on a table. Not in rigid grids — allowed to have slightly organic placement.

- **The bracket-header system** (borrowed from Chroma, made askLA's own):
  ```
  [■] VOTING RECORD           — data section
  [>] TRANSCRIPT               — expandable content
  [◆] PUBLIC COMMENT (14)      — collection with count
  [!] CONTENTIOUS              — alert/flag
  [~] TIMELINE                 — chronological view
  [?] PLAIN ENGLISH            — the explainer toggle
  ```
  These prefixes become the site's visual language. They signal section type at a glance. They look great in monospace. They're the thread that ties the warm editorial surface to the terminal data layer underneath.

- **Images and media**:
  - Council member photos: Warm-toned, consistent crop, large rounded corners. Presented Cabbages-style — floating on cream, not trapped in cards.
  - Map style: Warm, desaturated tiles (not the default blue Mapbox). Cream/tan land, soft gray water. District boundaries in the accent green, thick and visible. Pins are small, colorful, characterful — not generic Google markers.
  - Favicons/app icon: A pixel-art LA City Hall in green on cream. Distinctive at 16px.

- **Navigation (Cabbages-inspired)**:
  - Top bar is minimal: logo left, search center, 2-3 nav items right. Sparse, confident, not cluttered.
  - The real navigation lives in cross-links (every entity mention is a link), the search bar, the mascot, and a Cabbages-style mega-footer with organized text columns.
  - Filters use small rounded pills in sage green (like Cabbages' "Lunch x" tag). Dismissable with an x.

### Motion & Animation

The personality layer. Intentional, characterful, never blocking.

- **Page transitions**: Content panels ease in with a gentle slide-up (200ms). Not instant, not slow — smooth and satisfying. Sections within a page stagger in slightly on first load.
- **Loading states**: The mascot animates during waits. Short wait: blinks, looks around. Medium wait: shuffles papers, taps foot. Long wait: pulls out a tiny newspaper and reads it. A thin green progress bar runs across the top of the viewport (like YouTube's red bar, but green).
- **Hover states**: Elements respond warmly. Table rows get a soft cream highlight. Buttons press down slightly (1px translate). Links underline with a left-to-right wipe. Council member photos scale up slightly (1.02x) on hover. Cards lift with a subtle shadow increase.
- **Vote reveals**: The roll call animates member by member, left to right, with 80ms stagger. AYE appears in green, NAY in red — each with a small pop. Close votes: the last 3 members appear slower (tension). The final tally counts up with a satisfying snap.
- **Search**: Typing triggers a subtle CRT-scan-line animation across the search bar. Results stagger in top-to-bottom with a gentle fade+slide (50ms between each). The result count types out: "23 results across 14 meetings."
- **Data viz**: Charts draw on scroll-into-view (the classic D3 enter animation). The voting alignment network uses a force-directed simulation with gentle physics — nodes drift and settle, draggable, with connection lines that flex. Topic fingerprint bars fill left-to-right on first view.
- **The timeline**: On council file pages, the timeline events appear sequentially as you scroll, like chapters unfolding. Past events are solid, the pending/future event pulses gently.
- **Easter eggs**: Konami code on the home page triggers something (TBD — maybe all council member photos become pixel art for 10 seconds). Searching "clippy" makes the mascot do a backflip. Triple-clicking the status bar reveals the longest public comment ever recorded. Discovered and shared — they make people love the product.
- **Sound** (optional, off by default): A toggle in the status bar. When on: soft click on navigation, typewriter keystroke during search, a gavel tap when a vote result appears, a cheerful chime on the weekly digest notification. All subtle, all optional. The mascot can have a voice (short text-to-speech snippets) if enabled.

### The Mascot: City Hall Hal

A pixel-art animated character that lives in the app. Inspired by Clippy, Bonzi Buddy, and the Microsoft Office assistants — but actually useful and not annoying.

**Appearance**: A small pixel-art character themed around LA civic life. Could be:
- A miniature LA City Hall building with eyes and little legs (the building itself as a character)
- A cartoon city clerk with round glasses and a stack of papers
- An anthropomorphized microphone (representing public comment)
- A friendly pigeon (LA's actual most common bird, always present at city hall)

Whatever the form: expressive, 32x32 or 48x48 pixel base with multiple animation states, rendered in a sprite sheet. Think the detail level of a high-quality pixel art game character.

**Behavior**:
- **Draggable**: Lives in the bottom-right by default. Drag it anywhere. It remembers where you put it. If you drag it to the edge of the screen, it peeks around the corner.
- **Idle animations**: Blinks, shuffles papers, looks around, occasionally taps on the screen border, falls asleep if you haven't interacted in 5 minutes (wakes up when you move the mouse).
- **Contextual reactions**: On a vote page, it holds up a scorecard. On a meeting page, it sits in a tiny chair. On the map, it rides a tiny bus between districts. When search returns no results, it shrugs. When a contradictory statement is found, it does a double-take.
- **Ask it questions**: Click the mascot (or press a hotkey) to open a small chat bubble. This is a lightweight entry point to the Ask/LLM interface — you can ask quick questions without navigating to `/ask`. The mascot "speaks" the answer in a speech bubble with the retro pixel-font. For longer answers, it opens the full Ask page.
- **Tooltips and hints**: When you hover over a complex UI element, the mascot offers a one-line explanation in its speech bubble: "That's the voting alignment network — click a member to see who they vote with!" This replaces traditional tooltips with something that has character.
- **Celebrations**: When you follow your first council file, the mascot throws confetti. When you set your address, it waves a tiny flag. When you share something, it gives a thumbs up. Small, delightful, not obnoxious.
- **Dismissable**: A toggle in settings (or in the status bar) to hide the mascot entirely. Power users who find it distracting can turn it off. It should never block content or slow down the interface.

**Implementation**: CSS sprite sheet animation + a small React component with position state (persisted to localStorage). The mascot's contextual behavior is driven by the current route and page state. The chat bubble uses the same LLM backend as `/ask` but with a shorter, more casual system prompt ("answer in 1-2 sentences, be friendly and brief").

### Fun Features & Collectibles

Beyond the mascot, the retro theme opens up small engagement hooks:

- **Stickers**: When you find something interesting (a contradictory statement, a surprising vote, a broken promise), you can "sticker" it — adding a small annotation visible to other users. Stickers are pixel-art stamps: a red flag, a gold star, a question mark, a magnifying glass. The most-stickered items surface on the home page.
- **Your civic profile**: If you create an account, you get a profile page showing your activity — searches, followed files, council files you tracked to completion. Purely optional, but gives a sense of ongoing relationship with the platform.
- **Achievement badges**: "Attended your first meeting" (after clicking through to a meeting page and reading >50% of the transcript). "Followed 5 council files." "Asked a question the record couldn't answer." These are pixel-art badges displayed on your profile. Whimsical, not gamified — no points, no leaderboards, just small acknowledgments of civic engagement.
- **"Today in LA Council History"**: A daily card on the home page showing something interesting from the same date in a past year. "On this day in 2019, the council voted 14-1 to ban fur sales in LA. Council Member Buscaino was the lone dissent. He said..." Link to the meeting page. The mascot presents this with a little "did you know?" animation.
- **Seasonal themes**: The mascot wears a tiny Santa hat in December. During election season, it holds an "I Voted" sticker. On the anniversary of a major council vote, it holds a tiny cake. Subtle, discoverable, shareable.
- **Custom cursor**: A small pixel-art pointer that changes based on context — default arrow normally, magnifying glass during search, speech bubble when hovering over the mascot, a tiny gavel on vote pages. Toggleable in settings.
- **Status bar personality**: The bottom status bar occasionally rotates in small facts: "10,698 meetings indexed · longest meeting ever: 8h 42m (Budget & Finance, Jun 2023) · 20.9M words transcribed". These rotate slowly and are just... interesting. Clicking one links to the relevant data.

---

## The Object Model

Everything in askLA is one of six entity types. Every screen is a view of one entity, with links to related entities of other types. The entire app is a web of connections between these objects.

```
                    ┌──────────────┐
           ┌───────│   MEETING    │───────┐
           │       └──────┬───────┘       │
           │              │               │
           ▼              ▼               ▼
    ┌─────────────┐ ┌───────────┐  ┌───────────┐
    │   MEMBER    │ │AGENDA ITEM│  │  SPEAKER   │
    └──────┬──────┘ └─────┬─────┘  └───────────┘
           │              │
           ▼              ▼
    ┌─────────────┐ ┌───────────┐
    │    VOTE     │ │COUNCIL FILE│
    └─────────────┘ └───────────┘
```

- A **Meeting** contains Agenda Items, has Speakers, produces Votes
- An **Agenda Item** belongs to a Meeting, references a Council File
- A **Council File** appears across many Meetings over its lifecycle
- A **Member** attends Meetings, casts Votes, introduces Council Files
- A **Speaker** appears at Meetings, speaks on Agenda Items
- A **Vote** happens at a Meeting, on an Agenda Item, cast by Members

**Every mention of any entity anywhere in the app is a link.** If you're reading a transcript and it says "Council Member Park," that's a link to Park's profile. If it references "CF 25-1026," that's a link to the council file page. If a vote happened, the roll call links to each member. You can enter the app anywhere and follow connections in any direction.

---

## Navigation & Layout

### Persistent Shell

Every page shares the same shell:

```
┌─────────────────────────────────────────────────────────────┐
│  🏛 askLA        [_____Search the record_____]  Map  Council│
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Home > Meetings > Housing Committee 3/25/26               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      Page Content                           │
│                                                             │
│                                          ┌──────────┐      │
│                                          │ ◉◉  Hal  │      │
│                                          │  ╰──╯    │      │
│                                          │ 💬 Ask me!│      │
│                                          └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│  10,698 meetings · 1,590 transcripts · Updated 2h ago  🔊  │
└─────────────────────────────────────────────────────────────┘
```

- **Search bar**: Always visible. Accepts anything. Typing triggers a barcode-scanner animation across the bar. Results stagger in with a typewriter effect.
- **Three nav items**: Map (geographic entry), Council (people entry). The Ask function is accessed through the mascot — it's always with you.
- **Breadcrumbs**: Always show where you are. Each segment is clickable. Styled like a file path in a terminal: `Home / Meetings / Housing Committee 3.25.26`
- **Hal** (the mascot): Floating in the bottom-right, draggable anywhere. Click to open the quick-ask chat bubble. Reacts to the page you're on. Dismissable via settings.
- **Status bar**: Bottom of viewport. Shows data freshness and rotating fun facts. Sound toggle icon on the right.

### The Principle

There are no "modes." There is no role selector. There is one app with one navigation. A resident and an attorney see the same council file page — the page is just deep enough that both find what they need. The resident reads the plain-language summary at the top, maybe asks Hal a question, and stops. The attorney scrolls past it to the full legislative intent timeline and exports it for litigation. Same page, different depths. The mascot offers contextual help everywhere — it's the beginner's guide AND the power user's shortcut.

---

## Screens

### HOME `/`

The front door. Two states depending on whether the user has set an address.

**Cold state** (first visit):

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         askLA                               │
│           The City's Memory, Made Accessible                │
│                                                             │
│         [_________ Search the record _________]             │
│                                                             │
│   Try: "rent stabilization"  "CF 25-1026"  "Boyle Heights" │
│                                                             │
│  ┌─── THIS WEEK ──────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  ● Housing Cmte voted 3-2 to advance rent cap bill     │ │
│  │  ● PLUM approved 200-unit project at Fig & Jefferson   │ │
│  │  ● 47 speakers opposed encampment clearance in CD-14   │ │
│  │  ● Council approved $50M LAPD overtime increase (10-5) │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ CONTENTIOUS VOTES ───┐  ┌─ TRENDING IN PUBLIC COMMENT ┐│
│  │ Vote   Result  Split  │  │ ▲ homelessness (CD-14)      ││
│  │ CF-892 Passed  10-5   │  │ ▲ rent control (citywide)   ││
│  │ CF-341 Failed  6-9    │  │ ▲ street racing (Valley)    ││
│  │ CF-117 Passed  8-7    │  │ ▼ e-scooters               ││
│  └───────────────────────┘  └─────────────────────────────┘│
│                                                             │
│  [Set your address for a personalized feed →]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The home page is a **newsroom wire**. It answers: "What happened this week that matters?" Every item is a link to a deeper entity page. The contentious votes table links to vote detail pages. The trending topics link to search results. The "This Week" items link to meeting pages or council file pages.

**Warm state** (address set, returning user):

Same layout but the feed is filtered to your district and topics. A "My District" sidebar appears showing your council member, upcoming meetings in your area, and council files affecting your neighborhood. The wire becomes your personalized civic briefing.

### SEARCH RESULTS `/search?q=...`

The search bar understands intent and routes accordingly:

- Type a council file number → redirects straight to the council file page
- Type a council member name → redirects to their profile
- Type anything else → search results page

```
┌─────────────────────────────────────────────────────────────┐
│ Search: "rent stabilization in koreatown"                   │
│                                                             │
│ [Transcripts]  Council Files  Members  Meetings             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│ Filters: Date [2024-2026 ▼] Committee [All ▼] Speaker [▼]  │
│                                                             │
│ 1. Housing Committee · Mar 12, 2026 · CF 26-0341           │
│    "...extending rent stabilization protections to          │
│    buildings constructed after 1978 in the Koreatown        │
│    area would affect approximately 4,200 units..."          │
│    — Nithya Raman, during agenda item discussion            │
│    [▶ Watch at 1:14:33]  [→ Meeting]  [→ Council File]     │
│                                                             │
│ 2. City Council · Feb 28, 2026 · Public Comment             │
│    "My name is Maria Gutierrez, I live on Normandie.        │
│    I'm asking the council to protect tenants in             │
│    Koreatown from these rent increases..."                  │
│    — Maria Gutierrez, public commenter                      │
│    [▶ Watch at 2:41:08]  [→ Meeting]                        │
│                                                             │
│ 3. PLUM Committee · Jan 15, 2026 · CF 25-1026              │
│    ...                                                      │
│                                                             │
│ Showing 23 results across 14 meetings                       │
└─────────────────────────────────────────────────────────────┘
```

**Key details:**
- Results are transcript passages, not page titles. You see the actual words that were said.
- Every result has three exit links: watch the video at that moment, go to the full meeting page, go to the council file.
- Tabs across the top switch between result types. "Council Files" shows files matching the topic. "Members" shows who has spoken most about it. "Meetings" shows which meetings discussed it.
- Filters narrow by date, committee, speaker, meeting type. Filters are always visible, not hidden behind a button.

### COUNCIL FILE PAGE `/council-files/25-1026`

The lifecycle view. This is where a piece of legislation becomes a story.

```
┌─────────────────────────────────────────────────────────────┐
│ CF 25-1026                                          [Follow]│
│ Rent Stabilization Extension — Post-1978 Buildings          │
│ Status: IN COMMITTEE          Introduced: Jan 8, 2025      │
│ Author: Nithya Raman (CD-4)   Committee: Housing            │
│                                                             │
│ ┌─ PLAIN ENGLISH ─────────────────────────────────────────┐ │
│ │ This motion would extend LA's rent stabilization law    │ │
│ │ to cover apartment buildings built after 1978. Right    │ │
│ │ now, only pre-1978 buildings are covered. If passed,    │ │
│ │ about 200,000 additional units would get rent caps.     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ── TIMELINE ──────────────────────────────────────────────  │
│                                                             │
│  ● Jan 8, 2025   Introduced by Raman, referred to Housing  │
│  │                                                          │
│  ● Mar 3, 2025   Housing Cmte hearing                       │
│  │                14 speakers (11 support, 3 oppose)        │
│  │                Key debate: fiscal impact on landlords     │
│  │                Continued to next meeting                  │
│  │                [→ Read transcript]  [▶ Watch]             │
│  │                                                          │
│  ● Mar 17, 2025  Housing Cmte hearing                       │
│  │                Amendment by Harris: exempt 4-unit bldgs  │
│  │                Vote: Passed 4-1 (Harris dissenting)      │
│  │                [→ Read transcript]  [▶ Watch]  [Δ Diff]  │
│  │                                                          │
│  ● Apr 2, 2025   Full Council — PENDING                     │
│  │                ⚡ Your alert will fire when this happens  │
│  ○                                                          │
│                                                             │
│ ── WHO'S INVOLVED ────────────────────────────────────────  │
│                                                             │
│  Supporters (11)        Opponents (3)        Undecided       │
│  ├ Raman (author)       ├ Harris             ├ Park          │
│  ├ Soto-Martinez        ├ Lee                ├ Yaroslavsky   │
│  ├ Hernandez            └ Apt Assoc of LA    └ 8 others...  │
│  ├ SAJE (org)                                               │
│  ├ LA Tenants Union                                         │
│  └ 6 public commenters                                      │
│                                                             │
│ ── RELATED FILES ─────────────────────────────────────────  │
│  CF 24-0892  RSO Enforcement Funding (same committee)       │
│  CF 23-0617  Tenant Anti-Harassment Ordinance               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**The flow here:** The timeline IS the page. Every event on the timeline expands to show what happened — the transcript excerpt, the speakers, the vote, the amendment diff. You can read the entire story of a piece of legislation top-to-bottom. The "Who's Involved" section links to member profiles and speaker pages. "Related Files" links to other council file pages. The [Follow] button subscribes you to alerts on this file.

### MEETING PAGE `/meetings/17585`

A single meeting, structured as a navigable document.

```
┌─────────────────────────────────────────────────────────────┐
│ Housing Committee                              Mar 17, 2025 │
│ Duration: 2h 14m · 7 agenda items · 14 public speakers     │
│ Members present: Raman (chair), Harris, Soto-Martinez,      │
│                  Hernandez, Lee                              │
│ [▶ Watch full meeting]                          [Summary ▼] │
│                                                             │
│ ┌─ SUMMARY ───────────────────────────────────────────────┐ │
│ │ The committee advanced the rent stabilization extension  │ │
│ │ (CF 25-1026) with an amendment exempting 4-unit bldgs.  │ │
│ │ Three items passed on consent. The affordable housing    │ │
│ │ trust fund report was continued to April.                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ── AGENDA ────────────────────────────────────── JUMP TO ─  │
│                                                             │
│  1. Roll Call ................................. 0:00:00  ◁  │
│  2. Consent Calendar (3 items) ............... 0:03:12  ◁  │
│  3. CF 25-1026 Rent Stabilization Extension .. 0:08:44  ◁  │
│     └ Staff presentation .... 0:08:44                       │
│     └ Council member Q&A .... 0:24:10                       │
│     └ Public comment (11) ... 0:52:30                       │
│     └ Amendment & vote ...... 1:28:15                       │
│  4. CF 25-0892 Housing Trust Fund Report ..... 1:41:00  ◁  │
│     └ Continued to April 7                                  │
│  5. Public comment — general ................. 1:55:22  ◁  │
│  6. Adjournment .............................. 2:14:00  ◁  │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ ▼ 3. CF 25-1026 Rent Stabilization Extension                │
│                                                             │
│   STAFF PRESENTATION (15 min)                               │
│   Speaker: Jennifer Torres, Housing Dept                    │
│                                                             │
│   "The proposed ordinance would extend RSO protections      │
│   to approximately 200,000 units built between 1978 and     │
│   2008. Based on our analysis, the fiscal impact to         │
│   property owners would be..."                              │
│                                                             │
│   COUNCIL MEMBER Q&A (28 min)                               │
│   Harris: "What's the impact on small landlords who own     │
│   just a duplex or fourplex?"                               │
│   Torres: "Our analysis shows that 40% of affected units    │
│   are in buildings with 4 or fewer units..."                │
│   Harris: "That concerns me. I think we need a carveout."  │
│                                                             │
│   PUBLIC COMMENT (36 min) — 11 speakers                     │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Support: 8  │  Oppose: 2  │  Neutral: 1           │    │
│   └────────────────────────────────────────────────────┘    │
│   Maria Gutierrez: "I've lived in Koreatown for 20 years.  │
│   My building was built in 1985 and my landlord raised..."  │
│   [→ Full comment]                                          │
│                                                             │
│   VOTE                                                      │
│   Motion: Approve as amended (exempt 4-unit buildings)      │
│   Result: PASSED 4-1                                        │
│   ┌─────────┬─────────┬─────────┬─────────┬──────────┐     │
│   │ Raman   │ Harris  │ Soto-M  │Hernandez│   Lee    │     │
│   │  AYE    │   NAY   │  AYE    │  AYE    │  AYE     │     │
│   └─────────┴─────────┴─────────┴─────────┴──────────┘     │
│   [Δ View amendment diff]  [→ CF 25-1026 full history]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**The flow:** The agenda is a clickable table of contents on the left (or top on mobile). Click any item to jump to its section. Each section shows the transcript with speaker labels, and ends with the vote if there was one. The video player syncs — click any transcript line to jump to that moment in the YouTube video. Everything is cross-linked: member names link to profiles, council file numbers link to file pages, speaker names link to their history.

### MEMBER PAGE `/members/raman`

A council member's complete public record.

```
┌─────────────────────────────────────────────────────────────┐
│ Nithya Raman                                     [Compare]  │
│ Council District 4 · Term: 2020-2028                        │
│ Committees: Housing (chair), Budget & Finance               │
│                                                             │
│ [Overview]  [Votes]  [Statements]  [Attendance]  [Files]    │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                             │
│ ── TOPIC FINGERPRINT ─────────────────────────────────────  │
│                                                             │
│  Housing        ████████████████████░░  78% of speaking time│
│  Homelessness   ███████████░░░░░░░░░░  44%                  │
│  Budget         ████████░░░░░░░░░░░░░  32%                  │
│  Transportation ███░░░░░░░░░░░░░░░░░░  12%                  │
│  Public Safety  ██░░░░░░░░░░░░░░░░░░░   8%                  │
│                                                             │
│ ── VOTING SNAPSHOT ───────────────────────────────────────  │
│                                                             │
│  412 votes cast this term                                   │
│  Votes with majority: 94%                                   │
│  Lone dissents: 3                                           │
│  Most aligned with: Soto-Martinez (97%)                     │
│  Least aligned with: Lee (71%)                              │
│                                                             │
│ ── RECENT VOTES ────────────────── Filter: [All topics ▼]   │
│                                                             │
│  Mar 17  CF 25-1026  Rent stabilization ext.  AYE  4-1 ✓   │
│          Raman authored this motion. In committee, she      │
│          said: "This is about basic fairness for tenants    │
│          in buildings that are just as old as..."           │
│          [→ Full context]                                   │
│                                                             │
│  Mar 12  CF 26-0117  LAPD overtime budget     NAY  10-5 ✗   │
│          Raman was one of 5 no votes. On the floor:        │
│          "We cannot keep writing blank checks for           │
│          overtime when we're cutting library hours..."      │
│          [→ Full context]                                   │
│                                                             │
│  Mar 10  CF 25-0892  Housing trust fund       AYE  15-0 ✓   │
│          Unanimous. No floor discussion.                    │
│          [→ Full context]                                   │
│                                                             │
│ ── INTRODUCED ──────────────────────────────────────────── │
│  12 council files this term · 8 adopted · 2 pending · 2 ∅  │
│  [View all →]                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**The key:** Every vote includes a snippet of what the member actually said — not just "aye" or "nay" but the reasoning in their own words. This is what makes the page more than a scorecard. The topic filter on votes is critical: an organizer filters to "housing" to build a scorecard; a journalist filters to "public safety" to find contradictions; a staffer filters to their boss's committee. Same page, different uses.

The **[Compare]** button opens a side-by-side with any other member: vote alignment, topic differences, key disagreements.

### MAP PAGE `/map`

The geographic entry point. Full viewport.

```
┌─────────────────────────────────────────────────────────────┐
│ Layers: [Districts ✓] [Development ○] [Public Comment ○]    │
│         [Homelessness ○] [Infrastructure ○]                 │
│                                    [Search this area ___]   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │              ┌────────┐                                 │ │
│ │    CD-5      │  CD-4  │    CD-13                        │ │
│ │   Katy Young │ Raman  │  Soto-Martinez                  │ │
│ │              │  ●●●   │    ●                            │ │
│ │              └────────┘                                 │ │
│ │                  ●                                      │ │
│ │         CD-10          CD-1                             │ │
│ │        Hutt            Hernandez                        │ │
│ │                                                         │ │
│ │   ● = council activity this month                       │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ── CD-4 (clicked) ────────────────────────────────────────  │
│ Nithya Raman · 312 council actions this year                │
│ Hot topics: housing (43%), homelessness (28%), transit (15%)│
│ Recent: CF 25-1026 rent stabilization — in committee        │
│ [→ Full district view]  [→ Member profile]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**The flow:** Click a district → see its summary panel at bottom → click through to the member profile or a filtered search of everything in that district. Toggle layers to see different data: the "Development" layer shows land use cases as pins, "Public Comment" shows a heatmap of where commenters live, "Homelessness" shows encampment-related council actions. Every pin is clickable and links to the relevant meeting or council file page.

You can also search within the map view — type an address, zoom to it, and see all council activity within that area.

### ASK PAGE `/ask`

The conversational interface. A chat grounded in the public record.

```
┌─────────────────────────────────────────────────────────────┐
│ Ask the Record                                              │
│                                                             │
│ You: Has anyone discussed fixing the sidewalks              │
│      on Western Ave?                                        │
│                                                             │
│ askLA: Yes, sidewalks on Western Avenue have come up        │
│ in 3 meetings:                                              │
│                                                             │
│ 1. On Jan 14, 2026, resident Maria Gutierrez spoke          │
│    during public comment at the Public Works Committee       │
│    about cracked sidewalks between 3rd and 6th.            │
│    Council Member Soto-Martinez asked the Bureau of         │
│    Street Services to inspect.                              │
│    [→ Meeting] [▶ 1:42:08]                                  │
│                                                             │
│ 2. On Nov 3, 2025, the Bureau of Street Services            │
│    reported to the Budget Committee that Western Ave         │
│    is on the FY26 sidewalk repair priority list.            │
│    [→ Meeting] [▶ 0:55:12]                                  │
│                                                             │
│ 3. On Aug 22, 2025, CF 25-0441 was introduced to fund      │
│    pedestrian improvements on Western from Wilshire to      │
│    Olympic. It's currently in committee.                    │
│    [→ Council File]                                         │
│                                                             │
│ No follow-up inspection results have been discussed         │
│ in any subsequent meeting.                                  │
│                                                             │
│ [_______________Ask a follow-up_______________] [Send]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**The key:** Every sentence links to a source. The LLM synthesizes across meetings and entity types — pulling in public comments, staff testimony, and council file data — but never says anything it can't cite. The last line ("No follow-up...") is equally important: it tells you what DIDN'T happen, which is often the story.

### COUNCIL GRID `/council`

The people overview. All 15 members at a glance.

```
┌─────────────────────────────────────────────────────────────┐
│ LA City Council                                             │
│                                                             │
│ Sort: [District ▼]  Filter: [Current members ▼]             │
│                                                             │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│ │ CD-1     │ CD-2     │ CD-3     │ CD-4     │ CD-5     │   │
│ │Hernandez │ Krekorian│ Blumenf. │ Raman    │ Young    │   │
│ │██ hous.  │██ budget │██ safety │██ hous.  │██ trans. │   │
│ │Votes: 98%│Votes: 95%│Votes: 92%│Votes: 94%│Votes: 97%│   │
│ │w/maj     │w/maj     │w/maj     │w/maj     │w/maj     │   │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘   │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│ │ CD-6     │ CD-7     │ ...                             │   │
│ ...                                                         │
│                                                             │
│ ── VOTING ALIGNMENT ──────────────────────────────────────  │
│                                                             │
│ [Cluster map showing which members vote together, with      │
│  lines of varying thickness between them. Filterable by     │
│  topic area. Click any member to highlight their            │
│  connections.]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Each member card is a link to their full profile. The bottom half shows the voting alignment network — the coalitions. Filter by topic and watch the coalitions rearrange: the housing coalition is different from the public safety coalition.

---

## User Flows

These are the actual journeys through the app. Every flow is a path through the screens above, following links between entities.

### Flow 1: "What's happening near me?"

```
HOME → enter address → feed filters to your district
  → see "CF 25-1026: rent stabilization extension advanced in committee"
  → click → COUNCIL FILE PAGE (read the timeline, see your CM voted aye)
  → click your CM's name → MEMBER PAGE (see their full housing record)
  → click [Compare] → side-by-side with another member on housing votes
```

### Flow 2: "What did they say about rent control?"

```
SEARCH "rent control" → transcript results with highlighted excerpts
  → click a result → MEETING PAGE scrolled to that agenda item
  → read the transcript, watch the video at that timestamp
  → see "CF 25-1026" mentioned → click → COUNCIL FILE PAGE
  → read the full legislative timeline → see the vote
  → click the vote → see the roll call and floor debate
```

### Flow 3: "How does my council member vote?"

```
COUNCIL GRID → click your member → MEMBER PAGE
  → see topic fingerprint (they spend 78% of time on housing)
  → tab to [Votes] → filter to "public safety"
  → see they were absent for 40% of public safety votes
  → click a specific vote → MEETING PAGE at the debate
  → read what they said before voting
```

### Flow 4: "I want to speak at a hearing"

```
SEARCH a topic or council file → COUNCIL FILE PAGE
  → timeline shows "Next hearing: Apr 2, Full Council"
  → click the hearing → MEETING PAGE (upcoming)
  → see: signup link, expected public comment start time,
    number of speakers already signed up
  → link to prior testimony on this file
    ("Here's what 14 people said last time")
  → prepare your comment informed by the record
```

### Flow 5: "Is my neighborhood being ignored?"

```
MAP → click your district → see activity summary
  → toggle to "Infrastructure" layer → see dots
  → compare: CD-5 has 12 infrastructure motions, yours has 2
  → click into a neighboring district → see their activity
  → click [→ Full district view] → filtered search of all
    council actions mentioning your district
  → find: nothing about your street in 3 years
  → go to ASK → "Has anyone discussed potholes on Vermont
    between 3rd and Olympic?" → get sourced answer
```

### Flow 6: "I'm researching this council file for litigation"

```
SEARCH council file number → COUNCIL FILE PAGE
  → read the full timeline → expand every hearing
  → read full transcript of each hearing (legislative intent)
  → click a member who made contradictory statements
  → MEMBER PAGE → tab to [Statements] → filter to this topic
  → see their position shifted over 6 months
  → go back to COUNCIL FILE → see public comment archive
  → note: 47 opposed, 0 in favor, council voted yes anyway
  → [Export] → get Bates-numbered transcript excerpts
    with metadata for court filing
```

### Flow 7: "I need to brief my boss for tomorrow's meeting"

```
HOME → see upcoming meetings list → click tomorrow's committee
  → MEETING PAGE (upcoming) → see the agenda
  → click each agenda item → auto-generated brief appears:
    - council file history
    - prior testimony summary
    - member positions based on past statements
    - public comment sentiment preview
  → click a contentious item → COUNCIL FILE PAGE
  → see the "Who's Involved" section → know who to call
  → go to MEMBER pages for swing votes
  → see their past statements on this topic
  → prepare accordingly
```

### Flow 8: "What's the pattern here?"

```
COUNCIL GRID → click the voting alignment network
  → filter to "housing" → see two clear clusters
  → click a member who's between clusters → MEMBER PAGE
  → see they vote with Cluster A on rent control
    but Cluster B on development approvals
  → tab to [Votes] → filter to non-unanimous only
  → see the 12 times they were the swing vote
  → click one → MEETING PAGE → read the floor debate
  → find the quote that explains their reasoning
```

---

## The Cross-Linking Principle

The app has no dead ends. Every entity mention is a link. This creates an emergent navigation where users discover connections the designers didn't anticipate:

- Reading a transcript → notice a speaker name → click → see they've testified at 40 meetings → realize they're a lobbyist
- Looking at a council file timeline → notice it was amended → click diff → see a single line was changed → click the member who proposed it → see they received donations from the affected industry
- Browsing the map → see a cluster of development pins → click one → see the council file → see the same attorney represented all 5 projects → click the attorney → see their full testimony history

**The product's power isn't in any single screen — it's in the connections between them.** The entity model and universal linking make the app feel like a living web of civic knowledge rather than a collection of separate tools.

---

## Data Architecture

### Postgres (Neon) — Structured Facts

```
meetings
  id (PK, PrimeGov meeting_id)
  date, time
  title
  committee_id → committees
  meeting_type (council, committee, special)
  video_url
  duration_minutes
  agenda_document_path

committees
  id (PK)
  name
  current_members[]

council_members
  id (PK)
  name, normalized_name
  district
  term_start, term_end
  photo_url
  party

agenda_items
  id (PK)
  meeting_id → meetings
  item_number
  title
  council_file_id → council_files
  section_type (consent, regular, special, public_comment)

council_files
  id (PK)
  file_number (e.g., "25-1026")
  title
  introduced_date
  author_member_id → council_members
  status (pending, adopted, failed, withdrawn, filed)
  last_action_date

council_file_events
  id (PK)
  council_file_id → council_files
  meeting_id → meetings
  agenda_item_id → agenda_items
  event_type (introduced, referred, heard, amended, voted, signed, vetoed)
  event_date
  outcome
  notes

transcript_sections
  id (PK)
  meeting_id → meetings
  agenda_item_id → agenda_items
  section_type (pre_roll, roll_call, consent_calendar, presentation,
                public_comment_period, agenda_item, closed_session,
                procedural, adjournment)
  title
  speakers[] (jsonb)
  council_files[] (text[])
  clean_transcript (text)
  word_count
  start_timestamp, end_timestamp
  video_offset_seconds

votes
  id (PK)
  meeting_id → meetings
  agenda_item_id → agenda_items
  council_file_id → council_files
  motion_type (adopt, amend, table, reconsider, refer, approve)
  motion_text
  outcome (passed, failed, tabled, withdrawn)
  is_unanimous (bool)

vote_records
  id (PK)
  vote_id → votes
  council_member_id → council_members
  position (aye, nay, absent, abstain, recused)

speakers
  id (PK)
  name, normalized_name
  role (council_member, department_head, public_commenter,
        staff, lobbyist, attorney, organization_rep)
  organization
  first_appearance_date
  appearance_count

public_comments
  id (PK)
  meeting_id → meetings
  agenda_item_id → agenda_items
  speaker_id → speakers
  position (support, oppose, neutral)
  summary (text)
  duration_seconds
  was_cut_off (bool)

commitments
  id (PK)
  meeting_id → meetings
  speaker_id → speakers
  commitment_text
  target_date (nullable)
  directed_to (department or person)
  status (pending, fulfilled, overdue, abandoned)
  fulfilled_meeting_id → meetings (nullable)

-- Materialized views for common queries
council_member_vote_summary  -- per-member aggregates by topic
committee_activity_stats     -- meeting frequency, duration, throughput
pairwise_vote_agreement      -- the disagreement matrix
topic_attention_timeseries   -- topic prevalence over time
```

### Chroma (Vector DB) — Semantic Search

**Collection**: `transcript_chunks`

Each transcript section is split into ~500-token passages. Each chunk is embedded with metadata:

```json
{
  "id": "m17585_s3_c2",
  "text": "The 500-token passage...",
  "metadata": {
    "meeting_id": 17585,
    "meeting_date": "2025-12-02",
    "committee": "Government Operations Committee",
    "meeting_type": "committee",
    "section_type": "public_comment_period",
    "section_title": "Public Comment Period",
    "speakers": ["Maria Ponce"],
    "council_files": ["25-1026"],
    "agenda_items": [1, 4, 5],
    "word_position_start": 3400,
    "video_offset_seconds": 2847
  }
}
```

**Query pattern**: Semantic query → Chroma retrieves top-k passages → metadata filters narrow by date/committee/speaker → LLM re-ranks and synthesizes answer with citations.

**Additional collections** (future):
- `agenda_documents` — chunked agenda HTML/PDF for document-level search
- `council_file_texts` — motion text, ordinance language
- `public_comments` — individual public comments as separate embeddings for fine-grained retrieval

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router) | Vercel-native, RSC for data-heavy pages |
| **Hosting** | Vercel | Already provisioned via Stripe Projects |
| **Database** | Neon Postgres (serverless) | Free tier, edge-compatible, branching for dev/prod |
| **Vector DB** | Chroma Cloud | Already provisioned, hosted, managed |
| **LLM (chat)** | Claude or Gemini Flash | Synthesis and Q&A with citation |
| **LLM (ingestion)** | Gemini Flash | Already used in pipeline — structured transcript cleanup |
| **Embeddings** | Gemini text-embedding or OpenAI ada-002 | For Chroma ingestion |
| **Maps** | Mapbox GL JS | Custom retro style, council district boundaries, data layers |
| **Charts** | D3 / Observable Plot | Maximum control over retro aesthetic, no chart-library chrome |
| **Search** | Chroma (semantic) + Postgres pg_trgm/tsvector (exact) | Hybrid: semantic for concepts, full-text for identifiers |
| **Auth** | Clerk or NextAuth | If needed for saved preferences, watchlists, alerts |
| **Notifications** | Resend (email) + Twilio (SMS) + custom webhooks | Multi-channel alert delivery |
| **API** | Next.js API routes + tRPC or Hono | Typed API for both internal frontend and external consumers |
| **Background jobs** | Vercel Cron + Inngest or Trigger.dev | Transcript ingestion, alert processing, digest generation |

---

## Data Ingestion Pipeline (Existing → Platform)

The existing pipeline produces structured JSON per meeting. The platform ingestion step:

1. **Read structured Gemini output** (`sample_pipeline/output/m{id}_*.json`)
2. **Parse into relational tables**: meetings, agenda_items, transcript_sections, speakers, votes, vote_records, public_comments, council_files, council_file_events
3. **Entity resolution**: Normalize speaker names across meetings (fuzzy matching + manual corrections). Link council member names to their canonical IDs. Identify organizations.
4. **Chunk and embed**: Split transcript sections into ~500-token passages, embed via Gemini/OpenAI, upsert to Chroma with metadata.
5. **Extract commitments**: LLM pass over transcript sections to identify promises, directives, and deadlines. Insert into commitments table.
6. **Classify topics**: Tag each transcript section and agenda item with policy area labels (housing, public safety, budget, infrastructure, environment, etc.) using a classifier.
7. **Geocode**: Extract addresses and location references, geocode them, store for map display.
8. **Compute materialized views**: Update vote agreement matrices, topic timeseries, committee stats.

This runs as a batch job after each new meeting is processed, and incrementally as new meetings are added.

---

## Routes

```
/                              Home — search bar + weekly wire + contentious votes
/search?q=...                  Universal search results (transcripts, files, members, meetings)
/ask                           LLM chat interface grounded in the public record
/map                           Full-viewport map with district + topic layers
/council                       15-member grid + voting alignment network
/council/[slug]                Member profile (votes, statements, attendance, topics)
/council/[slug]/compare/[slug] Side-by-side member comparison
/meetings                      Calendar view, filterable by committee
/meetings/[id]                 Meeting detail — structured transcript + video sync
/files/[number]                Council file lifecycle — timeline, testimony, votes
/votes/[id]                    Vote detail — roll call + floor debate
/speakers/[id]                 Speaker history across all meetings
/api/v1/...                    Public REST API (JSON, CSV, Parquet)
```

Every route is a view of one entity. Every entity mention on every page is a link to another route. The app is a web, not a tree.

---

## External Data Sources (Future Integration)

The platform becomes dramatically more powerful when cross-referenced with:

| Source | What it adds | Integration |
|--------|-------------|-------------|
| **LA City Ethics Commission** | Campaign contributions, lobbyist registrations, Form 700 disclosures | Cross-reference speakers with donors, flag conflicts of interest |
| **LA City Budget (CAO)** | Actual budget line items | Link budget discussions in transcripts to real allocations |
| **Census / ACS** | Demographics by district | Equity analysis, disparate impact |
| **CalEnviroScreen** | Environmental justice scores | EJ overlay on map, CEQA analysis |
| **LA City Planning (ZIMAS)** | Parcel data, zoning, entitlements | Geocoded land use context |
| **LA Open Data Portal** | 311 requests, building permits, crime data | Ground-truth what the council discusses vs. what's actually happening |
| **Granicus** (2016-2021) | Professional CART transcripts for pre-YouTube era | Extend transcript coverage to 2016 |

---

## Phased Build Plan

### Phase 1: Foundation (MVP)
- Postgres schema + data ingestion from existing Gemini output
- Chroma embeddings for all processed transcripts
- Semantic search with citations
- Meeting explorer with structured transcripts
- Council member profiles with voting records
- Council file lifecycle tracker
- Basic map with district boundaries
- Next.js app deployed on Vercel

### Phase 2: Intelligence Layer
- LLM chat interface ("Talk to the Record")
- Auto-generated meeting summaries (plain language)
- Notification/alert system (email + webhook)
- Vote tracker with coalition analysis
- Public comment archive with sentiment
- Multi-language support (Spanish, Korean)
- Weekly digest emails

### Phase 3: Power User Tools
- Briefing packet generator
- Promise & commitment tracker
- Amendment diff viewer
- Precedent finder
- Topic model explorer / attention timeseries
- Public REST API with bulk export
- Embeddable widgets for news orgs

### Phase 4: Platform
- Brown Act compliance monitor
- Disparate impact analysis tools
- Budget discussion extractor
- Campaign finance cross-referencing
- Mobilization packet generator
- Audio briefings / podcast recaps
- Reproducible research notebooks
- Full external data integrations

---

## Design Principles

1. **Sources or it didn't happen.** Every claim, summary, and answer links to the exact transcript passage, vote record, or document it came from. Trust is non-negotiable.

2. **Address-first, jargon-last.** The default experience starts with where you live, not what committee you follow. Every piece of legislative language has a plain-English equivalent one click away.

3. **The same data, many lenses.** A resident, a journalist, and an attorney may all look at the same council file — but each sees the view that matters to them. The platform adapts; the data doesn't.

4. **Density is a feature.** This is a tool for serious use. Show the data. Use tables. Don't hide information behind clicks. The aesthetic respects the user's intelligence and time.

5. **Passive by default, active when ready.** The platform works even if you never open it (weekly digests, push alerts). When you're ready to dig in, the depth is there.

6. **The city's memory is public.** Everything on this platform comes from the public record. The platform doesn't editorialize — it organizes, searches, and presents what elected officials said and did, in their own words.
