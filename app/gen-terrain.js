#!/usr/bin/env node
/**
 * Generate 10x7 terrain grid tiles via Gemini.
 * Each tile is 512x512 showing ONLY terrain (no buildings).
 * Grid maps to real LA geography.
 */
const fs = require('fs');
const sharp = require('sharp');
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }
const DIR = 'public/sprites/terrain';
fs.mkdirSync(DIR, { recursive: true });

// 10 cols (west→east) x 7 rows (north→south)
// Col 0 = far west (ocean/Malibu), Col 9 = far east (Pasadena/East LA)
// Row 0 = far north (mountains), Row 6 = far south (harbor/port)

// Terrain type for each grid cell based on real LA geography
const GRID = [
  // Row 0: Mountains
  ['mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain'],
  // Row 1: Valley (flat suburban land with road grid)
  ['mountain-edge', 'valley-flat', 'valley-flat', 'valley-flat', 'valley-flat', 'valley-flat', 'valley-flat', 'valley-flat', 'foothills', 'foothills'],
  // Row 2: Hollywood Hills / transition zone
  ['coast-hills', 'hills-green', 'hills-green', 'hills-road', 'hills-green', 'hills-green', 'hills-road', 'hills-green', 'hills-urban', 'foothills'],
  // Row 3: Central LA (flat urban terrain with road grid)
  ['ocean-coast', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads'],
  // Row 4: Mid/South LA
  ['ocean-coast', 'beach-coast', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads'],
  // Row 5: Beach/LAX/South Bay
  ['ocean', 'ocean-beach', 'beach-flat', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads'],
  // Row 6: Harbor/Port
  ['ocean', 'ocean', 'ocean-coast', 'coast-flat', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-industrial', 'flat-roads'],
];

const PROMPTS = {
  'mountain': 'SimCity 4 style isometric terrain tile showing rugged brown and green mountain peaks with rocky faces, pine trees, winding mountain roads. Pure terrain, absolutely NO buildings or structures. Isometric perspective from above.',
  'mountain-edge': 'SimCity 4 style isometric terrain tile showing the edge of mountains transitioning to flat valley, green foothills with scattered trees, a winding road descending. NO buildings. Isometric perspective.',
  'valley-flat': 'SimCity 4 style isometric terrain tile showing flat green valley land with a grid of gray roads, green grass between road blocks, scattered trees along roads. NO buildings, just the empty road grid and grass. Isometric perspective.',
  'hills-green': 'SimCity 4 style isometric terrain tile showing green rolling hills with dense trees and bushes, winding hillside roads, lush vegetation. NO buildings. Isometric perspective.',
  'hills-road': 'SimCity 4 style isometric terrain tile showing green hills with a major winding road or freeway cutting through, green vegetation on both sides. NO buildings. Isometric perspective.',
  'hills-urban': 'SimCity 4 style isometric terrain tile showing hills transitioning to flat urban terrain, green hills on one side with a road grid emerging on the flat side. NO buildings. Isometric perspective.',
  'foothills': 'SimCity 4 style isometric terrain tile showing brown and green foothills with dry grass, scattered oak trees, winding trails. NO buildings. Isometric perspective.',
  'coast-hills': 'SimCity 4 style isometric terrain tile showing coastal cliffs meeting the ocean, green hillside with rocky cliffs dropping to blue water, dramatic coastline. NO buildings. Isometric perspective.',
  'ocean-coast': 'SimCity 4 style isometric terrain tile showing the Pacific Ocean meeting a sandy beach coastline, blue water with white wave crests near the tan sandy shore, some rocky outcrops. NO buildings. Isometric perspective.',
  'ocean-beach': 'SimCity 4 style isometric terrain tile showing a wide sandy beach with the blue Pacific Ocean, gentle waves, tan sand, the beach is wide and prominent. NO buildings. Isometric perspective.',
  'ocean': 'SimCity 4 style isometric terrain tile showing deep blue Pacific Ocean water with gentle rolling waves, varying shades of blue and teal, white wave crests. NO land, pure ocean water. Isometric perspective.',
  'beach-coast': 'SimCity 4 style isometric terrain tile showing a beach meeting flat land, sandy shore on one edge transitioning to green flat terrain with a road. NO buildings. Isometric perspective.',
  'beach-flat': 'SimCity 4 style isometric terrain tile showing flat land near the coast, sandy areas transitioning to green grass with a road grid starting. NO buildings. Isometric perspective.',
  'flat-roads': 'SimCity 4 style isometric terrain tile showing flat urban terrain with a clean grid of gray asphalt roads, green grass or bare ground between road blocks, intersection markings. NO buildings, just the empty road grid. Isometric perspective.',
  'coast-flat': 'SimCity 4 style isometric terrain tile showing coastline meeting flat industrial land, water on one side, flat gray and brown terrain with roads on the other. NO buildings. Isometric perspective.',
  'flat-industrial': 'SimCity 4 style isometric terrain tile showing flat terrain with wide roads, railroad tracks, and bare dirt lots typical of industrial zones. NO buildings. Isometric perspective.',
};

async function gen(name, prompt) {
  const outPath = `${DIR}/${name}.png`;
  if (fs.existsSync(outPath)) { console.log(`[skip] ${name}`); return true; }
  console.log(`[gen] ${name}...`);
  const fullPrompt = prompt + ' On solid bright green #00FF00 background. No text, no labels, no watermarks.';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances: [{ prompt: fullPrompt }], parameters: { sampleCount: 1, aspectRatio: '1:1' } })
  });
  const d = await r.json();
  if (!d.predictions?.[0]?.bytesBase64Encoded) { console.log(`[err] ${name}: no image`); return false; }
  const raw = Buffer.from(d.predictions[0].bytesBase64Encoded, 'base64');
  // Green screen removal
  const img = sharp(raw);
  const { width, height } = await img.metadata();
  const pixels = await img.ensureAlpha().raw().toBuffer();
  const out = Buffer.from(pixels);
  const bgR = out[0], bgG = out[1], bgB = out[2];
  const visited = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) { stack.push([x,0]); stack.push([x,height-1]); }
  for (let y = 0; y < height; y++) { stack.push([0,y]); stack.push([width-1,y]); }
  while (stack.length > 0) {
    const [x,y] = stack.pop();
    if (x<0||x>=width||y<0||y>=height) continue;
    const vi=y*width+x; if(visited[vi]) continue; visited[vi]=1;
    const idx=vi*4;
    if (Math.abs(out[idx]-bgR)<50 && Math.abs(out[idx+1]-bgG)<50 && Math.abs(out[idx+2]-bgB)<50) {
      out[idx+3]=0; stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
  }
  const result = await sharp(out, {raw:{width,height,channels:4}})
    .resize(512, 512, { fit: 'cover' }).png().toBuffer();
  fs.writeFileSync(outPath, result);
  console.log(`[done] ${name} (${(result.length/1024).toFixed(0)}KB)`);
  return true;
}

(async () => {
  console.log('=== Generating terrain grid (10x7 = 70 tiles) ===\n');
  for (let row = 0; row < GRID.length; row++) {
    console.log(`--- Row ${row} ---`);
    for (let col = 0; col < GRID[row].length; col++) {
      const terrainType = GRID[row][col];
      const prompt = PROMPTS[terrainType];
      if (!prompt) { console.log(`[err] Unknown terrain type: ${terrainType}`); continue; }
      const name = `t-${col}-${row}`;
      await gen(name, prompt);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  console.log('\n=== ALL TERRAIN TILES DONE ===');
})();
