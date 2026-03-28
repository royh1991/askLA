# CityOS — askLA Web Application

## What This Is

A **Windows XP-themed retro desktop environment** that serves as the frontend for the askLA civic intelligence platform. Instead of a traditional web app, the entire experience is a fictional operating system called **CityOS** where LA city government data lives inside draggable desktop applications.

The concept: you "boot up" CityOS and interact with city council data through desktop apps — Meeting Viewer, Council Files, a Terminal for search, a District Map, and Clippy as your AI civic assistant. The aesthetic is Windows XP Luna with the Bliss wallpaper, but the Hollywood sign is on the hill.

**Live at**: `localhost:3000` (dev), deployed to Vercel (production)

## Quick Start

```bash
cd app
npm install
npm run dev          # starts at localhost:3000 with Turbopack
```

To regenerate Clippy sprites or icons:
```bash
GEMINI_API_KEY=your_key node gen-clippy-frames.js   # animation frames
GEMINI_API_KEY=your_key node generate-sprites.js     # static sprites
GEMINI_API_KEY=your_key node process-icons.js        # background removal
```

## Architecture

```
page.tsx (entry)
  └─ BootSequence.tsx          # CRT terminal boot → splash screen → done
  └─ Desktop.tsx               # Window manager, taskbar, start menu, icons
       ├─ Window.tsx            # Draggable/resizable XP window chrome
       ├─ Clippy.tsx            # Animated mascot with speech bubble
       └─ apps/
            ├─ MeetingViewer.tsx    # Real transcript data (m17900)
            ├─ CouncilFiles.tsx     # Legislation lifecycle tracker
            ├─ Terminal.tsx         # "Ask the Record" search CLI
            └─ DistrictMap.tsx      # SVG map with real LA boundaries
```

### Flow

1. User loads page → `page.tsx` renders `<BootSequence>`
2. Boot sequence: green-on-black CRT terminal types system messages (PrimeGov connected, 10,698 meetings indexed, etc.), then shows askLA splash with progress bar
3. On complete → renders `<Desktop>` with XP wallpaper, icons, taskbar, Clippy
4. User double-clicks icon → `Desktop.openApp()` adds window to state array
5. `<Window>` renders with the matching app component as children
6. Clippy reacts to which app was opened with contextual messages

## The CityOS Aesthetic

### Windows XP Luna Theme

Everything is styled to match the Windows XP Luna Blue theme from 2001. This is defined in `globals.css`:

**Title bars**: Blue gradient (`#0997FF` → `#0058D6` → `#003D96`) with rounded 8px top corners. Inactive windows use a muted blue-gray gradient.

**Window buttons**:
- Minimize/Maximize: blue gradient with white SVG icons
- Close: red-orange gradient (`#F08B6E` → `#E4432E` → `#C4260E`)
- All have rounded 3px corners and 1px borders

**Taskbar**: Blue gradient (`#3168D5` → `#1C47B3` → `#122F87`) at bottom of viewport. Contains:
- Green Start button (rounded right side, italic "start" text)
- Quick launch area with 3 icon buttons
- Open window buttons (darker when active)
- System tray with clock

**Start Menu**: White left column (app list with hover highlight) + blue right sidebar (stats). Header has CityOS branding with city emoji.

**Buttons**: Gradient from white through light blue to pale blue, 3px rounded, 1px border. Darken on hover, invert on active.

**Scrollbars**: Custom XP-style with blue-gray track and thumb.

### Key CSS Classes

```css
.xp-titlebar              /* Window title bar gradient */
.xp-titlebar-inactive     /* Inactive window title bar */
.xp-window                /* Window shadow and border */
.xp-window-active         /* Active window enhanced shadow */
.xp-btn-close/min/max     /* Title bar buttons */
.xp-button                /* General XP button */
.xp-taskbar               /* Bottom taskbar gradient */
.xp-start-button          /* Green start button */
.xp-taskbar-button        /* Window button in taskbar */
.xp-taskbar-button-active /* Pressed/active state */
.xp-system-tray           /* Clock area */
.xp-start-menu            /* Start menu container */
.bracket-header            /* [■] SECTION HEADER style */
.desktop-pattern           /* Wallpaper background image */
.clippy-bubble             /* Yellow speech bubble */
.crt-flicker               /* CRT monitor flicker animation */
.cursor-blink              /* Blinking terminal cursor */
```

### The Bracket Header System

Data sections use a monospace bracket prefix system from the project spec:
```
[■] VOTING RECORD          — data section
[>] TRANSCRIPT              — expandable content
[◆] PUBLIC COMMENT (14)     — collection with count
[!] CONTENTIOUS             — alert/flag
[~] TIMELINE                — chronological view
[?] PLAIN ENGLISH           — explainer toggle
```

Implemented as `.bracket-header` class: monospace font, 11px, bold, uppercase, forest green, bottom border.

### Color System

| Purpose | Color | Usage |
|---------|-------|-------|
| Civic green | `#2D6A4F` | Links, headers, bracket prefixes, vote-aye |
| Cream background | `#F5F1EB` | Content area backgrounds inside windows |
| XP Blue | `#0054E3` | Window borders, selection highlight |
| Vote red | `#C1292E` | Nay votes, failed motions, dissent |
| Vote gold | `#D4A017` | Pending, abstain, in-committee status |
| Near black | `#1A1A1A` | Terminal background, body text |

### Typography

Three font layers:
- **Display** (`Georgia, serif`): Meeting titles, member names, section headers
- **Body** (`Segoe UI, Tahoma`): UI text, descriptions, button labels
- **Mono** (`Consolas, Courier New`): Council file numbers, terminal, bracket headers, vote tallies, timestamps

## Clippy — The Civic Assistant

### How It Works

Clippy uses **two static images** animated with **Framer Motion** — not sprite sheet animation. This approach was chosen after multiple iterations because Gemini generates inconsistent characters across frames, making sprite strip animation look janky.

**Images**:
- `clippy-main.png` — Eyes open, kawaii silver paperclip with sparkle eyes and rosy cheeks
- `clippy-blink.png` — Same character with happy closed eyes (curved lines)

Both have fully transparent backgrounds (including the interior holes of the paperclip).

**Animation** (all Framer Motion):
- **Idle bobbing**: `y: [0, -3, 0, -1, 0]` + `rotate: [0, 0.5, 0, -0.5, 0]` on 4s infinite loop
- **Blinking**: Random interval (2.5–6s), 150ms crossfade between open/closed images
- **Hover**: Scale up to 1.08x
- **Drop shadow**: `drop-shadow(2px 3px 6px rgba(0,0,0,0.25))`

**Speech Bubble**:
- Yellow gradient (`#FFFFF0` → `#FFFFCC`) with gold border (`#B8860B`)
- Title bar: "Clippy — Civic Assistant" with close button
- Search input with blue focus ring
- Quick suggestion chips: "rent stabilization", "transit signal priority", "who represents Venice?"
- Spring animation on open (`stiffness: 400, damping: 25`)
- Auto-dismiss after 10 seconds if no input shown
- Pointer triangle aimed at Clippy

**Behavior**:
- Draggable anywhere on screen (constrained to viewport)
- Click toggles speech bubble with search input
- When user opens an app, Desktop sends contextual message
- `onAsk` callback opens the Terminal app

### Generating New Sprites

All sprites generated via **Gemini Imagen 4.0** API with background removal via **sharp**:

```bash
# The pipeline:
# 1. Prompt Gemini for image on solid background
# 2. sharp: flood-fill from edges to remove outer background
# 3. sharp: threshold white pixels (>235) for interior removal
# 4. sharp: iterative erosion of remaining white near transparent areas
# 5. Verify corner pixels have alpha=0
```

Key lesson: generate on **white background** and flood-fill remove (not green/magenta chroma key — those colors bleed into the metallic character). For interior holes (paperclip loops), use a multi-pass white threshold + neighbor-context removal.

## Desktop Apps

### MeetingViewer (`apps/MeetingViewer.tsx`)

Displays a real meeting transcript — Transportation Committee, March 11, 2026 (meeting ID m17900). Data is hardcoded from the polished transcript in `polished/m17900_polished.md`.

**Layout**: Menu bar → toolbar → cream content area with sections:
- `[■] ROLL CALL` — Member attendance badges (green=present, red=absent)
- Expandable agenda items with vote badges (`Passed 4-0`, `Passed 3-1`)
- Click item → animated expand with vote roll call (staggered member badges)
- `[◆] PUBLIC COMMENT` — Speaker cards with stance tags (support/oppose/mixed) and quote snippets

### CouncilFiles (`apps/CouncilFiles.tsx`)

Split-pane legislation tracker. Left: file list with selection highlight. Right: detail view.

4 sample files: CF 25-1026 (rent stabilization), CF 24-1100 (transit), CF 15-1138-S42 (Venice hub), CF 26-0117 (LAPD overtime).

**Detail view**: Status badge → `[?] PLAIN ENGLISH` summary → `[~] TIMELINE` with vertical line and animated event dots (●=introduced, ◐=heard, Δ=amended, ✓=voted, ○=pending).

### Terminal (`apps/Terminal.tsx`)

Dark terminal (`#1A1A1A` background, `#40916C` green text) with `askLA>` prompt.

**Canned responses**: "help", "stats", "rent stabilization" (23 results across 14 meetings), "transit signal priority", "file 25-1026", "clear".

Unknown queries get a demo message explaining the full version would search all 20.9M words.

### DistrictMap (`apps/DistrictMap.tsx`)

SVG map of LA with **real council district boundaries** from the LA City ArcGIS GeoJSON endpoint (`services5.arcgis.com`). Boundaries were projected to an 800x700 SVG coordinate space.

**Features**:
- 15 districts with accurate geographic shapes and distinct colors
- Major freeways (I-5, US-101, I-405, I-10, I-110, SR-2)
- 8 landmarks with emoji markers (City Hall, LAX, Dodger Stadium, Hollywood Sign, Port, Getty, USC, Griffith Observatory)
- Toggle checkboxes: Labels, Freeways, Landmarks
- Pan (drag) and zoom (scroll wheel or buttons)
- Click district → detail panel with member name, neighborhoods, hot topics
- Hover highlights with thicker white border
- Dark theme background (`#2a3a2a`) with ocean hint

**Data per district**: id, name, member, color, neighborhoods[], hotTopics[], cx, cy (label center), path (SVG path data).

## Asset Generation

All visual assets are generated via the **Gemini API** (Imagen 4.0 and Gemini 3 Pro), not hand-drawn.

### Wallpaper (`public/wallpaper-bliss.png`)

Generated via **Imagen 4.0** with prompt emphasizing Windows XP Bliss aesthetic: hyper-saturated green rolling hills, vivid blue sky, fluffy clouds, with the HOLLYWOOD sign prominently on the central hillside. 16:9 aspect ratio.

Applied as `background: url('/wallpaper-bliss.png') center/cover no-repeat` on `.desktop-pattern`.

### Desktop Icons (`public/sprites/icon-*.png`)

6 XP-style glossy 3D icons generated via **Gemini 3 Pro** on green (#00FF00) backgrounds, then processed with sharp for chroma key removal. Resized to 128x128.

### Clippy Sprites (`public/sprites/clippy-*.png`)

Main + blink images generated via **Imagen 4.0**. Kawaii style, white background, processed with multi-pass background removal (flood-fill + white threshold + iterative erosion).

Legacy sprite strip files (`clippy-anim-*.png`) are still present but not used by the current Clippy component.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router, Turbopack) | Fast dev, React Server Components ready |
| Language | TypeScript | Type safety for civic data accuracy |
| Styling | Tailwind CSS 4 + custom CSS | Rapid UI + XP theme system |
| Animation | Framer Motion | Smooth GPU-accelerated animations |
| Image Processing | sharp | Sprite background removal |
| Sprite Generation | Gemini Imagen 4.0 / Gemini 3 Pro | AI-generated pixel art and icons |
| Hosting | Vercel | Already provisioned |

## File Structure

```
app/
├── src/
│   ├── app/
│   │   ├── globals.css          # 300 lines — full XP theme
│   │   ├── layout.tsx           # Root layout with metadata
│   │   └── page.tsx             # Boot → Desktop entry point
│   └── components/
│       ├── BootSequence.tsx      # CRT boot animation (19 lines of system messages)
│       ├── Clippy.tsx            # 2-image animated mascot + speech bubble
│       ├── Desktop.tsx           # Window manager, taskbar, start menu
│       ├── Window.tsx            # Draggable/resizable XP window
│       └── apps/
│           ├── MeetingViewer.tsx  # Real m17900 transcript
│           ├── CouncilFiles.tsx   # 4 sample council files
│           ├── Terminal.tsx       # "Ask the Record" CLI
│           └── DistrictMap.tsx    # Real LA boundaries SVG map
├── public/
│   ├── wallpaper-bliss.png       # Gemini-generated Bliss + Hollywood
│   └── sprites/
│       ├── clippy-main.png       # Kawaii Clippy (eyes open)
│       ├── clippy-blink.png      # Kawaii Clippy (eyes closed)
│       ├── icon-meetings.png     # XP-style desktop icons
│       ├── icon-files.png
│       ├── icon-terminal.png
│       ├── icon-map.png
│       ├── icon-recycle.png
│       └── icon-spec.png
├── generate-sprites.js           # Gemini sprite generation script
├── gen-clippy-frames.js          # Animation frame generator
├── process-icons.js              # Icon background removal
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

## Traps and Lessons Learned

### Sprite Generation
- **Don't use sprite strips from Gemini**: It generates inconsistent characters across frames. Generate single images and animate with code.
- **Don't use green/magenta chroma key on metallic characters**: The colors bleed into silver/gray tones. Use white backgrounds with flood-fill removal instead.
- **Interior transparency**: Flood-fill from edges can't reach enclosed white areas (e.g., inside paperclip loops). Need a second pass with white threshold + neighbor-context removal.
- **Gemini model names change**: As of March 2026, working models are `imagen-4.0-generate-001` (predict endpoint) and `gemini-3-pro-image-preview` (generateContent with `responseModalities: ['TEXT', 'IMAGE']`).

### Dev Server
- **Turbopack caches aggressively**: If CSS changes don't appear, delete `.next/` and restart. The CSS file URL hash doesn't always change.
- **`GEMINI_API_KEY` is NOT in `.env`**: It was set via environment variable during sessions. The `.env` file has `CHROMA_API_KEY` and `GROQ_API_KEY` but not Gemini.

### Windows XP Theme
- The XP Luna gradient is very specific — it's NOT a simple two-color gradient. Title bars use a 6-stop gradient with precise color stops at 0%, 3%, 6%, 85%, 95%, 100%.
- Window borders are 3px colored borders, not box shadows. The `border-radius` is 8px top only (flat bottom).
- Start button is italic text with rounded right side only.
- The Bliss wallpaper should be hyper-saturated — almost surreal greens and blues, not photorealistic.

### Data
- Meeting data is from real transcript `polished/m17900_polished.md`
- District boundaries are real GeoJSON from `services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Council_Districts/FeatureServer/0/query`
- Council member names may be outdated (the GeoJSON has old names; the component has 2026 names hardcoded)
