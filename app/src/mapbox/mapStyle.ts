// Custom MapLibre style that makes the base map look like SimCity
// Dark green terrain, thick simplified roads, minimal labels
// Based on OpenFreeMap Liberty but with heavy color overrides

export const MAP_STYLE: any = {
  version: 8,
  name: 'SimCity LA',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      bounds: [-118.8, 33.6, -117.9, 34.4], // LA metro only — skip tiles outside
    },
  },
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  light: {
    anchor: 'viewport',
    color: '#FFFCF4',   // neutral-warm sunlight (not too yellow)
    intensity: 0.9,     // strong but not harsh shadows
    position: [1.5, 210, 35],  // moderate sun angle
  },
  layers: [
    // Background — dark green like SimCity grass
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#68B050' }, // bright vivid SimCity grass
    },
    // Water — deep SimCity blue
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': '#2858A0' },
    },
    // Water shore highlight
    {
      id: 'water-outline',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'line-color': '#1A4080',
        'line-width': 1.5,
      },
    },
    // Natural landcover — forests/woods darker green
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'wood'],
      paint: { 'fill-color': '#3A7A30', 'fill-opacity': 0.8 },
    },
    // Natural landcover — grass
    {
      id: 'landcover-grass',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'grass'],
      paint: { 'fill-color': '#5A9A42', 'fill-opacity': 0.7 },
    },
    // Parks — bright SimCity green (distinct from terrain)
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'park', 'cemetery', 'grass'],
      paint: { 'fill-color': '#58B848' },
    },
    // Park outlines for definition
    {
      id: 'landuse-park-outline',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'park', 'cemetery', 'grass'],
      paint: { 'line-color': '#3A8A28', 'line-width': 1 },
    },
    // Residential zones — SimCity green residential tint
    {
      id: 'landuse-residential',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'residential'],
      paint: { 'fill-color': '#4C8840' },
    },
    // Commercial zones — subtle blue-green (SimCity commercial zone hint)
    {
      id: 'landuse-commercial',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'commercial', 'retail'],
      paint: { 'fill-color': '#3A6A52' },
    },
    // Industrial zones — yellow-green (SimCity industrial zone hint)
    {
      id: 'landuse-industrial',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'industrial'],
      paint: { 'fill-color': '#5A7A38' },
    },
    // Hospital/school — distinct areas
    {
      id: 'landuse-education',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'school', 'university'],
      paint: { 'fill-color': '#4A7850', 'fill-opacity': 0.6 },
    },
    // Minor roads — thin dark gray grid
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['in', 'class', 'minor', 'service', 'track', 'path']],
      paint: {
        'line-color': '#3A3A3A',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 3, 18, 6],
      },
    },
    // Secondary road sidewalks — light gray casing for SimCity sidewalk effect
    {
      id: 'road-secondary-sidewalk',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'secondary', 'tertiary'],
      paint: {
        'line-color': '#6A6A60',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 7, 18, 14],
      },
    },
    // Secondary roads — medium dark gray
    {
      id: 'road-secondary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'secondary', 'tertiary'],
      paint: {
        'line-color': '#383838',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 5, 18, 10],
      },
    },
    // Primary road sidewalks — lighter casing
    {
      id: 'road-primary-sidewalk',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'primary'],
      paint: {
        'line-color': '#707068',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 10, 18, 18],
      },
    },
    // Primary roads — dark casing
    {
      id: 'road-primary-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'primary'],
      paint: {
        'line-color': '#2A2A2A',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 8, 18, 14],
      },
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'primary'],
      paint: {
        'line-color': '#484848',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 6, 18, 10],
      },
    },
    // Highway sidewalk/shoulder
    {
      id: 'road-highway-shoulder',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#606058',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 12, 8, 16, 20],
      },
    },
    // Highways/motorways — thick with yellow center line
    {
      id: 'road-highway-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#1A1A1A',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2, 12, 6, 16, 16],
      },
    },
    {
      id: 'road-highway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#505050',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 12, 4, 16, 12],
      },
    },
    // Highway center line — yellow dashes like SimCity
    {
      id: 'road-highway-center',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#C8B020',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.3, 14, 1, 18, 2],
        'line-dasharray': [4, 4],
      },
    },
    // Railway
    {
      id: 'railway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'rail'],
      paint: {
        'line-color': '#666666',
        'line-width': 1.5,
        'line-dasharray': [3, 3],
      },
    },
    // Building footprints (2D flat, for areas without 3D)
    {
      id: 'building-2d',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': '#6B6B5B',
        'fill-opacity': 0.3,
      },
    },
    // Only essential labels — neighborhood names, no clutter
    {
      id: 'place-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['in', 'class', 'city', 'town', 'suburb', 'neighbourhood'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Open Sans Semibold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 14, 13, 18, 16],
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#E8E8D8',
        'text-halo-color': '#2A3A2A',
        'text-halo-width': 2,
      },
    },
    // Road labels — very subtle
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
        'text-size': 9,
        'symbol-placement': 'line',
        'text-max-angle': 30,
      },
      paint: {
        'text-color': '#A0A090',
        'text-halo-color': '#3A4A3A',
        'text-halo-width': 1,
      },
    },
  ],
};
