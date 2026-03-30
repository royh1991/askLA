#!/usr/bin/env node
// Extract tall OR large-footprint buildings from GeoJSON for early-zoom rendering
// Includes: skyscrapers (>40m), named landmarks, and large-area structures
// (stadiums, airports, arenas, convention centers)
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const files = [
  '../public/data/dtla_buildings.geojson',
  '../public/data/hollywood_ktown_usc_buildings.geojson',
  '../public/data/lax_buildings.geojson',
  '../public/data/dodger_stadium.geojson',
];

// Calculate polygon area in sq meters using Shoelace formula on lat/lng
function polygonArea(coords) {
  const DEG_TO_M = 111320;
  let area = 0;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0] * DEG_TO_M * Math.cos(coords[i][1] * Math.PI / 180);
    const yi = coords[i][1] * DEG_TO_M;
    const xj = coords[j][0] * DEG_TO_M * Math.cos(coords[j][1] * Math.PI / 180);
    const yj = coords[j][1] * DEG_TO_M;
    area += (xi * yj) - (xj * yi);
  }
  return Math.abs(area / 2);
}

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
      const coords = f.geometry.coordinates[0];
      const area = coords ? polygonArea(coords) : 0;

      // Prominence score: combine height and area
      // Tall buildings score by height, wide buildings score by footprint
      const isLargeArea = area > 5000; // >5000 sq m = stadium/arena/terminal sized
      const isTall = effectiveHeight > 40;
      const isNamedMedium = props.name && (effectiveHeight > 15 || area > 2000);
      const isManyLevels = levels > 12;

      if (isTall || isLargeArea || isNamedMedium || isManyLevels) {
        // For large-area low buildings, ensure minimum visible height
        const displayHeight = Math.max(effectiveHeight, isLargeArea ? 15 : 0);

        features.push({
          type: 'Feature',
          geometry: f.geometry,
          properties: {
            height: displayHeight,
            name: props.name || '',
            render_height: displayHeight,
            area: Math.round(area),
            prominence: Math.round(displayHeight * 2 + Math.sqrt(area)),
          },
        });
      }
    }
  } catch (e) {
    console.warn(`Skipping ${file}: ${e.message}`);
  }
}

// Sort by prominence (height + area) and take top 500
features.sort((a, b) => b.properties.prominence - a.properties.prominence);
const top = features.slice(0, 500);

const geojson = { type: 'FeatureCollection', features: top };
const outPath = path.join(__dirname, '../public/data/prominent_buildings.geojson');
writeFileSync(outPath, JSON.stringify(geojson));

const tall = top.filter(f => f.properties.height > 40).length;
const wide = top.filter(f => f.properties.area > 5000).length;
const named = top.filter(f => f.properties.name).length;
console.log(`Wrote ${top.length} prominent buildings (${tall} tall, ${wide} large-area, ${named} named)`);
console.log(`Top 5 by prominence:`);
top.slice(0, 10).forEach(f => {
  const p = f.properties;
  console.log(`  ${p.name || 'unnamed'} — ${p.height}m, ${p.area} sq m, prominence: ${p.prominence}`);
});
