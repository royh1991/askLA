#!/usr/bin/env node
/**
 * Generate 10x7 terrain grid tiles via Gemini.
 * Each tile is 512x512 showing terrain viewed from above at slight angle.
 * NO green screen — tiles fill their entire rectangle edge-to-edge.
 * NO isometric diamond shape — full rectangular coverage for seamless tiling.
 */
const fs = require('fs');
const sharp = require('sharp');
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }
const DIR = 'public/sprites/terrain';
fs.mkdirSync(DIR, { recursive: true });

// 10 cols x 7 rows. Each cell has a terrain description.
// These must generate as FULL-BLEED rectangular images with NO background.
const GRID = [
  // Row 0: Mountains (top of map)
  ['mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain'],
  // Row 1: Valley flat (suburban terrain with road grid)
  ['mountain-valley', 'valley', 'valley', 'valley', 'valley', 'valley', 'valley', 'valley', 'valley-foothills', 'foothills'],
  // Row 2: Hollywood Hills
  ['coast-cliffs', 'hills', 'hills', 'hills-roads', 'hills', 'hills', 'hills-roads', 'hills', 'urban-hills', 'foothills'],
  // Row 3: Central LA (flat with road grid)
  ['coast-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban'],
  // Row 4: Mid / South LA
  ['coast-beach', 'beach-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban', 'flat-urban'],
  // Row 5: Beach / LAX / South Bay
  ['ocean', 'ocean-beach', 'beach-flat', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads', 'flat-roads'],
  // Row 6: Harbor / Port
  ['ocean', 'ocean', 'ocean-coast', 'coast-industrial', 'flat-industrial', 'flat-roads', 'flat-roads', 'flat-industrial', 'flat-industrial', 'flat-roads'],
];

const BASE_STYLE = 'SimCity 4 video game style, viewed from above at a slight angle, seamless tile that fills the entire image edge to edge with NO empty space and NO background. The terrain covers every pixel of the image.';

const PROMPTS = {
  'mountain': `Rugged mountain terrain with rocky brown peaks, pine trees, snow-capped ridges, winding mountain road. ${BASE_STYLE}`,
  'mountain-valley': `Mountain terrain transitioning to flat green valley, foothills descending to flat land with some roads appearing. ${BASE_STYLE}`,
  'valley': `Flat green valley land with a grid of gray suburban roads, green lawns between road blocks, scattered trees along streets. ${BASE_STYLE}`,
  'valley-foothills': `Valley flat terrain transitioning to brown-green foothills, some roads fading into hillside. ${BASE_STYLE}`,
  'foothills': `Brown and green foothills with dry grass, scattered oak trees, winding trails. ${BASE_STYLE}`,
  'coast-cliffs': `Dramatic coastal cliffs where green hills meet blue ocean water, rocky shoreline, waves crashing. ${BASE_STYLE}`,
  'hills': `Lush green rolling hills with dense trees, bushes, varied green tones. ${BASE_STYLE}`,
  'hills-roads': `Green hills with a major road or freeway cutting through, gray asphalt road winding through green vegetation. ${BASE_STYLE}`,
  'urban-hills': `Green hills transitioning to flat urban terrain, hillside on one side and a road grid emerging on the flat side. ${BASE_STYLE}`,
  'coast-urban': `Coastline meeting urban land, blue ocean water on the left edge and flat terrain with some roads on the right. ${BASE_STYLE}`,
  'coast-beach': `Sandy beach meeting flat urban terrain, golden sand strip along the left edge, green grass and roads on the right. ${BASE_STYLE}`,
  'beach-urban': `Wide sandy beach area transitioning to flat land with roads, tan sand on one side, urban road grid beginning on the other. ${BASE_STYLE}`,
  'flat-urban': `Flat urban terrain with a clean grid of gray asphalt roads and green grass or dirt lots between them, typical empty city blocks ready for development. ${BASE_STYLE}`,
  'flat-roads': `Flat terrain with roads forming a grid pattern, some with brown dirt and some with green grass patches between intersections. ${BASE_STYLE}`,
  'ocean': `Deep blue Pacific Ocean water filling the entire image, gentle waves, varying shades of blue and teal. ${BASE_STYLE}`,
  'ocean-beach': `Ocean meeting a sandy beach, blue water on the left half, golden sand on the right half, white surf where they meet. ${BASE_STYLE}`,
  'beach-flat': `Beach sand transitioning to flat green terrain with the beginning of a road grid. ${BASE_STYLE}`,
  'ocean-coast': `Ocean water meeting a rocky coastline, blue water on the left, rocky shore and flat terrain starting on the right. ${BASE_STYLE}`,
  'coast-industrial': `Coastline meeting flat industrial terrain, water on one edge, gray flat land with wide roads and railroad tracks. ${BASE_STYLE}`,
  'flat-industrial': `Flat industrial terrain with wide roads, railroad tracks, bare dirt lots, concrete areas. ${BASE_STYLE}`,
};

async function gen(name, prompt) {
  const outPath = `${DIR}/${name}.png`;
  if (fs.existsSync(outPath)) { console.log(`[skip] ${name}`); return true; }
  console.log(`[gen] ${name}...`);

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: prompt + ' No text, no labels, no watermarks, no hex codes.' }],
      parameters: { sampleCount: 1, aspectRatio: '1:1' }
    })
  });
  const d = await r.json();
  if (!d.predictions?.[0]?.bytesBase64Encoded) {
    console.log(`[err] ${name}: ${d.error?.message || 'no image'}`);
    return false;
  }
  const raw = Buffer.from(d.predictions[0].bytesBase64Encoded, 'base64');

  // NO background removal — just resize to 512x512 and save directly
  const result = await sharp(raw).resize(512, 512, { fit: 'cover' }).png().toBuffer();
  fs.writeFileSync(outPath, result);
  console.log(`[done] ${name} (${(result.length / 1024).toFixed(0)}KB)`);
  return true;
}

(async () => {
  console.log('=== Generating terrain grid (10x7 = 70 tiles) ===');
  console.log('Full-bleed rectangular tiles, NO green screen, NO transparency\n');

  let success = 0, fail = 0;
  for (let row = 0; row < GRID.length; row++) {
    console.log(`--- Row ${row} ---`);
    for (let col = 0; col < GRID[row].length; col++) {
      const terrainType = GRID[row][col];
      const prompt = PROMPTS[terrainType];
      if (!prompt) { console.log(`[err] Unknown: ${terrainType}`); fail++; continue; }
      const ok = await gen(`t-${col}-${row}`, prompt);
      if (ok) success++; else fail++;
      await new Promise(r => setTimeout(r, 5000)); // 5s delay to avoid rate limits
    }
  }
  console.log(`\n=== DONE: ${success} success, ${fail} failed ===`);
})();
