# SimCity LA — MapLibre GL JS + deck.gl Spec

## Overview

Replace the Pixi.js sprite-based SimCity map with a real 3D interactive map of Los Angeles using **MapLibre GL JS** (free, no API key) + **deck.gl** for data overlays. The map renders inside the CityOS desktop Window component as the "District Map" application.

The goal: a map that looks like SimCity 4 (pitched 3D camera, colorful zoning, extruded buildings) but uses **real geographic data** — real building footprints, real zoning, real council district boundaries.

## Zero Credentials Required

| Component | License | API Key | Cost |
|-----------|---------|---------|------|
| MapLibre GL JS | MIT | None | Free |
| OpenFreeMap tiles | Free | None | Free |
| deck.gl | MIT | None | Free |
| LA Open Data APIs | Public | None | Free |

## Architecture

```
src/mapbox/
├── SPEC.md              # This file
├── SimCityMap.tsx        # React component — the entire map widget
├── mapStyle.ts           # Custom MapLibre style JSON (SimCity palette)
├── layers.ts             # deck.gl layer factories (districts, zoning, heatmaps)
└── districtData.ts       # Council district metadata + centroids
```

The existing `src/engine/SimCityApp.tsx` gets rewritten to mount `SimCityMap` instead of the Pixi.js `Game`. The sidebar, toolbar, and status bar UI from SimCityApp.tsx are preserved — only the map canvas changes.

## Tech Stack

```
maplibre-gl          — WebGL map renderer (free Mapbox GL fork)
react-map-gl/maplibre — React wrapper for MapLibre
@deck.gl/core        — GPU-accelerated data viz framework
@deck.gl/layers      — GeoJsonLayer, HeatmapLayer, etc.
@deck.gl/mapbox      — MapLibre/Mapbox interleaving (z-occlusion with 3D buildings)
```

## Map Configuration

### Camera (SimCity feel)
```typescript
initialViewState: {
  longitude: -118.2437,  // Downtown LA
  latitude: 34.0522,
  zoom: 11.5,            // City overview
  pitch: 55,             // Oblique 3/4 view like SimCity
  bearing: -17,          // Slight rotation
}
maxPitch: 65
minPitch: 30
maxZoom: 18
minZoom: 9
```

### Base Style (SimCity palette)
Use OpenFreeMap tiles (`https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf`) with a custom style JSON that overrides colors:

```
Background:       #1E2D1E (dark green-black, like SimCity night)
Water:            #1A4A70 (deep blue)
Parks/green:      #2D6A4F (civic green, matching askLA theme)
Residential land: #3A5A3A (muted green)
Commercial land:  #3A4A6A (muted blue)
Industrial land:  #5A5A3A (muted yellow-brown)
Roads:            #4A4A4A (dark gray)
Highways:         #5A5A5A (medium gray, wider)
Road labels:      #8A9A8A (subtle)
```

### 3D Buildings (fill-extrusion layer)
```typescript
{
  id: 'buildings-3d',
  type: 'fill-extrusion',
  source: 'openmaptiles',
  'source-layer': 'building',
  minzoom: 13,
  paint: {
    'fill-extrusion-color': [
      'interpolate', ['linear'], ['get', 'render_height'],
      0, '#81C784',    // Short = residential green
      15, '#64B5F6',   // Medium = commercial blue
      40, '#FFD54F',   // Tall = office yellow
      80, '#CE93D8',   // Skyscrapers = purple
    ],
    'fill-extrusion-height': ['get', 'render_height'],
    'fill-extrusion-base': ['get', 'render_min_height'],
    'fill-extrusion-opacity': 0.85,
  }
}
```

This gives us height-based SimCity coloring: low green houses, medium blue offices, tall yellow/purple skyscrapers. No custom data needed — OpenStreetMap already has building heights.

## Data Layers (via deck.gl)

### Layer 1: Council Districts (always visible)
- **Source**: Static GeoJSON from ArcGIS (15 polygons, ~500KB)
- **Endpoint**: `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Council_Districts/FeatureServer/0/query?outFields=*&where=1%3D1&outSR=4326&f=geojson`
- **Save as**: `src/data/la-districts.json` (static file)
- **Rendering**: `GeoJsonLayer` with colored fill (district color + 0.15 alpha), white stroke, pickable
- **Interaction**: Click → fly to district centroid, select in sidebar. Hover → highlight border.

### Layer 2: Zoning Overlay (toggleable)
- **Source**: LA GeoHub Zoning ArcGIS Feature Service
- **Endpoint**: Query with `$limit` and viewport-based spatial filter
- **Rendering**: `GeoJsonLayer` with zone_class mapped to SimCity colors:
  - R1, R2, R3, R4, R5 → Green (residential)
  - C1, C2, C4, C5 → Blue (commercial)
  - M1, M2, M3 → Yellow (industrial)
  - PF, PB → Purple (public facilities)
  - OS → Dark green (open space)
- **Interaction**: Hover shows zone type tooltip

### Layer 3: Permit Heatmap (toggleable)
- **Source**: LA Open Data building permits
- **Endpoint**: `https://data.lacity.org/resource/pi9x-tg5x.json?$limit=50000&$where=ISSUE_DATE>'2023-01-01'`
- **Rendering**: `HeatmapLayer` showing permit density
- **Color**: Green (low) → Yellow → Red (high density)

### Layer 4: Neighborhood Labels (always visible at medium zoom)
- **Source**: Hardcoded array of {name, lat, lng} for ~30 LA neighborhoods
- **Rendering**: `TextLayer` with SimCity-style floating labels

## React Integration

### SimCityMap.tsx
```tsx
'use client';
import { useCallback, useRef, useState } from 'react';
import Map from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeoJsonLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE } from './mapStyle';
import { createDistrictLayer } from './layers';
import districtsGeoJson from '../data/la-districts.json';

// Render <Map> with deck.gl overlay
// Expose flyToDistrict(), resetView() via ref
// Emit onDistrictSelect to parent for sidebar
```

### Integration with Desktop.tsx
Desktop.tsx line 145 currently renders `<SimCityApp />`. The rewritten SimCityApp.tsx will:
1. Import `SimCityMap` via `next/dynamic` (ssr: false) — MapLibre accesses `window`
2. Render `<SimCityMap>` in the flex-1 area
3. Keep the existing sidebar (district details panel)
4. Keep the toolbar with zoom/reset/overlay toggles
5. Keep the status bar

## Interaction Flows

### Click District
1. User clicks on map → deck.gl `GeoJsonLayer` fires `onClick`
2. Extract `district` number from feature properties
3. Update React state: `selectedDistrict = districtData[id]`
4. Map flies to district centroid: `map.flyTo({ center, zoom: 13, pitch: 55, duration: 1500 })`
5. District polygon opacity increases to 0.4
6. Sidebar shows district details (member, neighborhoods, hot topics)

### Click Sidebar District
1. User clicks district in sidebar list
2. Same as above but triggered from React state change
3. Map receives new `selectedDistrictId` prop → flies to it

### Zoom In
1. At zoom < 13: see district boundaries, labels, road network
2. At zoom 13+: 3D building extrusions appear, colored by height
3. At zoom 15+: individual buildings distinguishable, permit heatmap visible

### Toggle Overlays
- [x] Districts (always on by default)
- [ ] Zoning (colored polygons by zone type)
- [ ] Permits (heatmap of recent building activity)
- [ ] Labels (neighborhood name signs)

## Performance

- MapLibre renders vector tiles on GPU — handles millions of building polygons at 60fps
- deck.gl uses GPU picking for instant click/hover on GeoJSON polygons
- Static district GeoJSON (~500KB) loaded once at mount
- Zoning/permit data lazy-loaded only when overlay toggled on
- `next/dynamic` with `ssr: false` keeps MapLibre off initial bundle

## Files to Create/Modify

### New files
- `src/mapbox/SimCityMap.tsx` — Core MapLibre + deck.gl React component
- `src/mapbox/mapStyle.ts` — Custom style JSON with SimCity palette
- `src/mapbox/layers.ts` — deck.gl layer factory functions
- `src/mapbox/districtData.ts` — 15 district metadata records with centroids
- `src/data/la-districts.json` — Static GeoJSON from ArcGIS

### Modified files
- `src/engine/SimCityApp.tsx` — Replace Pixi.js canvas with `<SimCityMap>`
- `package.json` — New dependencies (already installed)

### Preserved (no changes)
- `src/components/Desktop.tsx` — Window manager, unchanged
- `src/components/Window.tsx` — Window chrome, unchanged
- `src/app/globals.css` — XP theme, unchanged

## Implementation Order

1. Fetch LA districts GeoJSON → save as static file
2. Create `mapStyle.ts` with OpenFreeMap + SimCity color overrides
3. Create `districtData.ts` with 15 district metadata records
4. Create `layers.ts` with `createDistrictLayer()` factory
5. Create `SimCityMap.tsx` — MapLibre map + deck.gl overlay + 3D buildings
6. Rewrite `SimCityApp.tsx` to mount SimCityMap instead of Pixi.js Game
7. Test: verify map renders in Window, districts clickable, sidebar works
8. Add 3D building extrusion layer with SimCity colors
9. Add neighborhood label layer
10. Add zoning overlay toggle
11. Add permit heatmap toggle
12. Polish: fly-to animation, hover effects, performance optimization
