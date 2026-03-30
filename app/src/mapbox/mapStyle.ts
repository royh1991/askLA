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
    },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    // Background — dark green like SimCity grass
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#4A7A3A' },
    },
    // Water — deep blue
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': '#2A5A8A' },
    },
    // Land use — parks are brighter green
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'park', 'cemetery', 'grass'],
      paint: { 'fill-color': '#5A9A4A' },
    },
    // Residential areas — slightly lighter green
    {
      id: 'landuse-residential',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'residential'],
      paint: { 'fill-color': '#4D8040' },
    },
    // Commercial/industrial — muted green-gray
    {
      id: 'landuse-commercial',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'commercial', 'industrial', 'retail'],
      paint: { 'fill-color': '#506848' },
    },
    // Minor roads — thin dark gray
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['in', 'class', 'minor', 'service', 'track', 'path']],
      paint: {
        'line-color': '#3A3A3A',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 2, 18, 4],
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 4, 18, 8],
      },
    },
    // Primary roads — thick dark gray with casing
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
    // Highways/motorways — thick with yellow center line feel
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
    // Highway center line — yellow like SimCity
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
        'text-font': ['Open Sans Bold'],
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
        'text-font': ['Open Sans Regular'],
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
