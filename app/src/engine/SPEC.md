# SimCity LA — Isometric Game Engine Spec

## Overview

A fully interactive SimCity 2000-style isometric city simulation of Los Angeles, embedded as a desktop app inside CityOS. Built with **Pixi.js** (2D WebGL game renderer) and integrated with the existing Next.js/React app as the District Map application.

The goal: take the Gemini-generated SimCity image (which the user loved) and make it **real** — an actual navigable, interactive isometric city where you can pan around, zoom into neighborhoods, see animated traffic, click buildings, and overlay the 15 LA council district boundaries with full civic data integration.

## Architecture

```
app/src/engine/
├── SPEC.md              # This file
├── SimCityApp.tsx        # React wrapper — mounts Pixi.js into a div
├── Game.ts              # Main game class — Pixi.Application setup, game loop
├── IsometricMap.ts      # Tile map manager — grid, coordinate conversion
├── TileRegistry.ts      # Sprite atlas/registry — loads tile textures
├── Camera.ts            # Pan/zoom/scroll camera controls
├── DistrictOverlay.ts   # GeoJSON district boundaries rendered as Pixi graphics
├── BuildingLayer.ts     # Building placement and interaction
├── TerrainLayer.ts      # Ground tiles — grass, water, mountains, roads
├── AnimationManager.ts  # Traffic, smoke, water shimmer, blinking lights
├── UIOverlay.ts         # District labels, tooltips, hover info (Pixi text)
├── MapData.ts           # The actual LA city layout — tile placement data
└── types.ts             # Shared TypeScript types
```

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Renderer | Pixi.js v8 | Industry-standard 2D WebGL renderer, handles thousands of sprites at 60fps, built-in sprite sheets, filters, interaction |
| Tile sprites | Gemini Imagen 4.0 | Generate isometric tile sprites (buildings, terrain, landmarks) via API |
| React integration | @pixi/react or manual mount | Embed Pixi canvas inside the existing Window component |
| District data | GeoJSON from ArcGIS | Real LA council district boundaries |
| Meeting data | manifest.json | 7,427 meetings linked to districts |

## Isometric Grid System

### Coordinate System

Standard isometric projection with 2:1 diamond tiles:

```
Screen coordinates (px):     Tile coordinates (grid):

      /\                     (0,0) (1,0) (2,0)
     /  \                    (0,1) (1,1) (2,1)
    /    \                   (0,2) (1,2) (2,2)
    \    /
     \  /
      \/

Tile width:  64px
Tile height: 32px (2:1 ratio)
```

### Conversion Functions

```typescript
// Grid → Screen
function gridToScreen(gx: number, gy: number): { x: number, y: number } {
  return {
    x: (gx - gy) * (TILE_WIDTH / 2),
    y: (gx + gy) * (TILE_HEIGHT / 2),
  };
}

// Screen → Grid
function screenToGrid(sx: number, sy: number): { gx: number, gy: number } {
  return {
    gx: Math.floor((sx / (TILE_WIDTH / 2) + sy / (TILE_HEIGHT / 2)) / 2),
    gy: Math.floor((sy / (TILE_HEIGHT / 2) - sx / (TILE_WIDTH / 2)) / 2),
  };
}
```

### Map Dimensions

- Grid size: **120 x 100 tiles** (covers the full LA city area)
- Each tile = ~0.25 square miles of real LA
- Total viewable area: 7,680 x 3,200 pixels at 1x zoom

## Tile Types

### Terrain Tiles (generated via Gemini)

| ID | Type | Description | Sprite |
|----|------|-------------|--------|
| 0 | `water` | Pacific Ocean, blue with subtle wave animation | 64x32 isometric diamond, blue with white wave crests |
| 1 | `grass` | Flat grassland, parks | 64x32 green isometric diamond |
| 2 | `dirt` | Undeveloped land | 64x32 brown/tan isometric diamond |
| 3 | `road_ns` | North-south road | 64x32 gray road with lane markings |
| 4 | `road_ew` | East-west road | 64x32 gray road, perpendicular |
| 5 | `road_cross` | Intersection | 64x32 crossroad |
| 6 | `highway` | Freeway segment | 64x32 wide gray highway |
| 7 | `mountain` | Mountain/hill terrain | 64x48 elevated brown/green terrain |
| 8 | `sand` | Beach/coastal | 64x32 tan/beige diamond |

### Building Tiles (generated via Gemini)

Buildings sit ON TOP of terrain tiles and extend upward.

| ID | Type | Height | Description |
|----|------|--------|-------------|
| 10 | `house_small` | 1 | Small residential house |
| 11 | `house_medium` | 1 | Medium residential |
| 12 | `apartment_low` | 2 | Low-rise apartment (2-3 stories) |
| 13 | `apartment_mid` | 3 | Mid-rise apartment (4-8 stories) |
| 14 | `apartment_high` | 5 | High-rise apartment |
| 15 | `office_low` | 2 | Low-rise office building |
| 16 | `office_mid` | 4 | Mid-rise office |
| 17 | `skyscraper` | 8 | Downtown skyscraper |
| 18 | `skyscraper_tall` | 12 | Tall skyscraper (US Bank Tower etc.) |
| 20 | `commercial` | 1 | Strip mall / retail |
| 21 | `industrial` | 2 | Factory/warehouse |
| 22 | `park` | 0 | Green park with trees |
| 23 | `stadium` | 3 | Stadium/arena |
| 30 | `city_hall` | 4 | LA City Hall (landmark) |
| 31 | `airport_terminal` | 2 | LAX terminal |
| 32 | `airport_runway` | 0 | Runway |
| 33 | `port_crane` | 3 | Port crane |
| 34 | `port_container` | 1 | Container yard |
| 35 | `hollywood_sign` | 1 | Hollywood sign on hillside |
| 36 | `observatory` | 2 | Griffith Observatory |
| 37 | `dodger_stadium` | 3 | Dodger Stadium |

## Map Layout (MapData.ts)

The map represents real LA geography. Each cell in the 120x100 grid maps to a real location:

```
Grid Layout (approximate):

Row 0-15:   Mountains (San Gabriel, Santa Monica ranges)
Row 15-20:  San Fernando Valley (CD-3, CD-6, CD-7, CD-12)
Row 20-25:  Hollywood Hills transition
Row 25-50:  Central LA (CD-1, CD-2, CD-4, CD-5, CD-10, CD-13, CD-14)
Row 30-40:  Downtown core (CD-9, CD-14) — dense skyscrapers
Row 40-60:  South LA (CD-8, CD-9, CD-10, CD-15)
Row 50-55:  LAX area (CD-11)
Row 55-70:  Harbor area, coastal
Row 70-100: San Pedro / Port (CD-15) — extends south

Col 0-20:   Pacific Ocean (west)
Col 20-40:  Westside (CD-5, CD-11) — Venice, Santa Monica adj.
Col 40-60:  Mid-city
Col 60-80:  Central/Downtown
Col 80-100: East LA (CD-1, CD-14)
Col 100-120: Eastern edge
```

### Freeway Network

Major freeways rendered as `highway` tiles:

- **I-5** (Golden State): Runs N-S through center-east
- **US-101** (Hollywood): Runs NW-SE through Hollywood, downtown
- **I-405** (San Diego): Runs N-S on west side
- **I-10** (Santa Monica): Runs E-W through mid-city
- **I-110** (Harbor): Runs N-S from downtown to port
- **SR-2** (Glendale): Runs NE from Hollywood

## District Overlay System

### How It Works

The 15 council district boundaries (from GeoJSON) are projected onto the isometric grid and rendered as semi-transparent colored polygons in a Pixi.Graphics layer above the tile map.

```typescript
// For each district:
// 1. Take GeoJSON polygon coordinates (lat/lng)
// 2. Convert to grid coordinates using the map's geographic bounds
// 3. Convert grid coordinates to screen coordinates (isometric projection)
// 4. Draw as Pixi.Graphics polygon with district color + alpha
```

### Interaction

- **Hover** district → highlight border, show district name tooltip
- **Click** district → emit event to React parent with district data
- **Toggle** overlay on/off via toolbar
- **Selected** district pulses gently (alpha oscillation)

## Animations

### Ambient (always running)
- **Water shimmer**: Ocean tiles slowly cycle through 3-4 blue shade frames
- **Traffic**: Small colored dots move along road tiles at constant speed
- **Building lights**: Random windows in tall buildings blink on/off at night
- **Smoke/steam**: Subtle particle effect from industrial buildings
- **Trees sway**: Park trees have a gentle 2-frame sway animation
- **Clouds**: Slow-moving shadow overlay that drifts across the map

### Interactive
- **Hover building**: Slight scale-up (1.05x), tooltip with building info
- **Click building**: Pop-up info card
- **District select**: Buildings in district glow with district color
- **Zoom**: Smooth camera interpolation

## Camera System

### Controls
- **Pan**: Click + drag anywhere (or WASD keys)
- **Zoom**: Mouse wheel (min: 0.3x, max: 3x, default: 1x)
- **Minimap**: Small overview in corner showing full city with viewport rectangle
- **Snap to district**: Click district in sidebar → camera smoothly pans to center of district

### Implementation
```typescript
class Camera {
  x: number;       // World position
  y: number;
  zoom: number;    // 0.3 to 3.0
  targetX: number; // For smooth interpolation
  targetY: number;
  targetZoom: number;

  update(dt: number) {
    // Lerp towards target
    this.x += (this.targetX - this.x) * 0.1;
    this.y += (this.targetY - this.y) * 0.1;
    this.zoom += (this.targetZoom - this.zoom) * 0.1;
  }
}
```

## React Integration (SimCityApp.tsx)

The Pixi.js game mounts inside a React component which lives inside the CityOS Window:

```typescript
// SimCityApp receives callbacks from Desktop.tsx
interface SimCityAppProps {
  onDistrictSelect: (district: District) => void;
  selectedDistrictId: number | null;
  width: number;
  height: number;
}

// Mount Pixi.Application into a div ref
// Game communicates with React via event emitter pattern
// React sidebar shows district details (already built in DistrictMap.tsx)
```

## Sprite Generation Pipeline

All tile sprites generated via **Gemini Imagen 4.0**:

1. Generate sprite sheet: "A sprite sheet of isometric SimCity 2000 style tile sprites arranged in a grid on bright green #00FF00 background. Row 1: water tile, grass tile, dirt tile, sand tile. Row 2: road NS, road EW, road intersection, highway. Each tile is 64x32 pixels isometric diamond shape. Retro pixel art style."

2. Generate building sprites individually: "A SimCity 2000 style isometric pixel art [building type], [N] stories tall, on bright green #00FF00 background. 64 pixels wide, retro pixel art."

3. Process with sharp: green-screen removal, slice into individual tiles, save as sprite sheet atlas.

## Performance Targets

- **60 FPS** at 1x zoom on modern browser
- **< 2 second** initial load (sprite atlas < 2MB total)
- **Culling**: Only render tiles visible in viewport (typically ~200-400 of 12,000 total)
- **Batching**: Pixi.js auto-batches sprites with same texture
- **Sprite atlas**: All tiles packed into 1-2 texture atlases to minimize draw calls

## Implementation Order

1. **Phase 1 — Pixi.js setup**: Install pixi.js, create Game.ts, mount in React, render a flat green grid
2. **Phase 2 — Tile sprites**: Generate terrain tiles via Gemini, build TileRegistry, render textured map
3. **Phase 3 — Buildings**: Generate building sprites, place them according to MapData layout
4. **Phase 4 — Camera**: Pan, zoom, smooth interpolation, minimap
5. **Phase 5 — District overlay**: Project GeoJSON onto isometric grid, render colored polygons
6. **Phase 6 — Interactivity**: Hover/click districts, emit events to React, sidebar integration
7. **Phase 7 — Animations**: Water, traffic, lights, clouds
8. **Phase 8 — Polish**: Landmarks (City Hall, LAX, Hollywood sign), sound effects toggle, performance optimization
