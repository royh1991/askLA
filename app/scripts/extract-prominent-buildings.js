#!/usr/bin/env node
// Extract tall/prominent buildings from GeoJSON files for early-zoom rendering
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const files = [
  '../public/data/dtla_buildings.geojson',
  '../public/data/hollywood_ktown_usc_buildings.geojson',
  '../public/data/lax_buildings.geojson',
  '../public/data/dodger_stadium.geojson',
];

const features = [];

for (const file of files) {
  try {
    const data = JSON.parse(readFileSync(path.join(__dirname, file), 'utf8'));
    for (const f of data.features || []) {
      if (f.geometry?.type !== 'Polygon') continue;
      const props = f.properties || {};
      const height = parseFloat(props.height) || 0;
      const levels = parseFloat(props['building:levels']) || 0;
      const effectiveHeight = height || levels * 3.5;

      // Include if: tall (>40m), or many levels (>12), or named landmark
      if (effectiveHeight > 40 || levels > 12 || (props.name && effectiveHeight > 20)) {
        features.push({
          type: 'Feature',
          geometry: f.geometry,
          properties: {
            height: effectiveHeight,
            name: props.name || '',
            render_height: effectiveHeight,
          },
        });
      }
    }
  } catch (e) {
    console.warn(`Skipping ${file}: ${e.message}`);
  }
}

// Sort by height descending and take top 300 for performance
features.sort((a, b) => b.properties.height - a.properties.height);
const top = features.slice(0, 300);

const geojson = { type: 'FeatureCollection', features: top };
const outPath = path.join(__dirname, '../public/data/prominent_buildings.geojson');
writeFileSync(outPath, JSON.stringify(geojson));
console.log(`Wrote ${top.length} prominent buildings (of ${features.length} candidates)`);
console.log(`Top 5: ${top.slice(0, 5).map(f => `${f.properties.name || 'unnamed'} (${f.properties.height}m)`).join(', ')}`);
