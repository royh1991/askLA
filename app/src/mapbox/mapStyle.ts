// SimCity LA — Custom MapLibre style
// VIVID cartoon terrain, punchy zone colors, thick roads, bold labels
// This is a video game, not Google Maps

export const MAP_STYLE: any = {
  version: 8,
  name: 'SimCity LA',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      bounds: [-118.8, 33.6, -117.9, 34.4], // LA metro only
    },
    'terrain-dem': {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 14,
      bounds: [-118.8, 33.6, -117.9, 34.4],
    },
    'hillshade-dem': {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 14,
      bounds: [-118.8, 33.6, -117.9, 34.4],
    },
  },
  terrain: {
    source: 'terrain-dem',
    exaggeration: 4.5, // dramatic but not insane
  },
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  light: {
    anchor: 'viewport',
    color: '#FFFFFF',
    intensity: 1.0,     // full contrast shadows for cartoon depth
    position: [1.5, 200, 30],  // dramatic low sun angle
  },
  layers: [
    // ═══════════════════════════════════════
    // TERRAIN — bright vivid SimCity greens
    // ═══════════════════════════════════════
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#70C050' }, // VIVID SimCity grass
    },
    // Water — rich saturated blue
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': '#2060B0' },
    },
    {
      id: 'water-outline',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'line-color': '#1848A0', 'line-width': 2 },
    },
    // Forests — deep rich green
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'wood'],
      paint: { 'fill-color': '#2A6820', 'fill-opacity': 0.9 },
    },
    // Grass landcover
    {
      id: 'landcover-grass',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'grass'],
      paint: { 'fill-color': '#58B040', 'fill-opacity': 0.75 },
    },
    // ═══════════════════════════════════════
    // ZONES — SimCity-style zone tinting
    // Green=Residential, Blue=Commercial, Yellow=Industrial
    // ═══════════════════════════════════════
    // Parks — BRIGHT neon green, unmistakable
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'park', 'cemetery', 'grass'],
      paint: { 'fill-color': '#48D040' }, // neon park green
    },
    {
      id: 'landuse-park-outline',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'park', 'cemetery', 'grass'],
      paint: { 'line-color': '#28A020', 'line-width': 1.5 },
    },
    // Residential — classic SimCity green zone
    {
      id: 'landuse-residential',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'residential'],
      paint: { 'fill-color': '#58A848' },
    },
    // Commercial — SimCity blue zone hint
    {
      id: 'landuse-commercial',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'commercial', 'retail'],
      paint: { 'fill-color': '#388870' },
    },
    // Industrial — SimCity yellow zone hint
    {
      id: 'landuse-industrial',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'industrial'],
      paint: { 'fill-color': '#708830' },
    },
    // Schools/hospitals — distinct teal
    {
      id: 'landuse-education',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'school', 'university', 'hospital'],
      paint: { 'fill-color': '#408868', 'fill-opacity': 0.7 },
    },
    // ═══════════════════════════════════════
    // HILLSHADE — on top of ALL fills so terrain shading
    // shows through residential, parks, everywhere
    // ═══════════════════════════════════════
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'hillshade-dem',
      paint: {
        'hillshade-shadow-color': '#1A3020',
        'hillshade-highlight-color': '#C8E878',
        'hillshade-accent-color': '#385828',
        'hillshade-exaggeration': 0.9,
      },
    },
    // ═══════════════════════════════════════
    // ROADS — thick dark grid, cartoon sidewalks
    // ═══════════════════════════════════════
    // Minor roads — visible grid lines
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['in', 'class', 'minor', 'service', 'track', 'path']],
      paint: {
        'line-color': '#404040',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 2.5, 18, 5],
      },
    },
    // Secondary — sidewalk casing (lighter)
    {
      id: 'road-secondary-sidewalk',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'secondary', 'tertiary'],
      paint: {
        'line-color': '#787870',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 14, 8, 18, 16],
      },
    },
    {
      id: 'road-secondary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'secondary', 'tertiary'],
      paint: {
        'line-color': '#404040',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 5, 18, 10],
      },
    },
    // Primary — thick with sidewalk
    {
      id: 'road-primary-sidewalk',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'primary'],
      paint: {
        'line-color': '#808078',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 12, 18, 20],
      },
    },
    {
      id: 'road-primary-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'primary'],
      paint: {
        'line-color': '#2A2A2A',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 14, 9, 18, 16],
      },
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'primary'],
      paint: {
        'line-color': '#585858',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 6, 18, 12],
      },
    },
    // Highways — big bold arteries
    {
      id: 'road-highway-shoulder',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#686860',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 4, 12, 10, 16, 24],
      },
    },
    {
      id: 'road-highway-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#1A1A1A',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 12, 7, 16, 18],
      },
    },
    {
      id: 'road-highway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#585858',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2, 12, 5, 16, 14],
      },
    },
    // Highway center — bold yellow dashes
    {
      id: 'road-highway-center',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#E0C020',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 1.5, 18, 3],
        'line-dasharray': [3, 3],
      },
    },
    // Railway — dashed gray
    {
      id: 'railway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'rail'],
      paint: {
        'line-color': '#888888',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    },
    // ═══════════════════════════════════════
    // BUILDINGS — 2D footprints (3D added dynamically)
    // ═══════════════════════════════════════
    {
      id: 'building-2d',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': '#808070',
        'fill-opacity': 0.25,
      },
    },
    // ═══════════════════════════════════════
    // LABELS — bold, readable, game-UI style
    // ═══════════════════════════════════════
    {
      id: 'place-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['in', 'class', 'city', 'town', 'suburb', 'neighbourhood'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Open Sans Semibold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 11, 14, 14, 18, 18],
        'text-max-width': 8,
        'text-transform': 'uppercase',
      },
      paint: {
        'text-color': '#FFFFF0',
        'text-halo-color': '#1A2A1A',
        'text-halo-width': 2.5,
      },
    },
    // Road labels
    {
      id: 'road-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary'],
      minzoom: 14,
      layout: {
        'text-field': '{name}',
        'text-font': ['Open Sans Semibold'],
        'text-size': 10,
        'symbol-placement': 'line',
        'text-max-angle': 30,
      },
      paint: {
        'text-color': '#C0C0B0',
        'text-halo-color': '#2A3A2A',
        'text-halo-width': 1.5,
      },
    },
  ],
};
