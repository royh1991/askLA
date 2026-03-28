#!/usr/bin/env node
const fs = require('fs');
const sharp = require('sharp');
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAzShfSJqSVfU6te2MniRfUrm1fj13qgT8';
const DIR = 'public/sprites/hoods';

fs.mkdirSync(DIR, { recursive: true });

async function gen(name, prompt) {
  const outPath = `${DIR}/${name}.png`;
  if (fs.existsSync(outPath)) { console.log(`[skip] ${name}`); return true; }
  console.log(`[gen] ${name}...`);
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: '1:1' } })
  });
  const d = await r.json();
  if (!d.predictions?.[0]?.bytesBase64Encoded) { console.log(`[err] ${name}`); return false; }
  const raw = Buffer.from(d.predictions[0].bytesBase64Encoded, 'base64');

  // Remove background via flood fill from edges
  const img = sharp(raw);
  const { width, height } = await img.metadata();
  const pixels = await img.ensureAlpha().raw().toBuffer();
  const out = Buffer.from(pixels);
  const bgR = out[0], bgG = out[1], bgB = out[2];
  const visited = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) { stack.push([x, 0]); stack.push([x, height - 1]); }
  for (let y = 0; y < height; y++) { stack.push([0, y]); stack.push([width - 1, y]); }
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const vi = y * width + x;
    if (visited[vi]) continue;
    visited[vi] = 1;
    const idx = vi * 4;
    if (Math.abs(out[idx] - bgR) < 50 && Math.abs(out[idx+1] - bgG) < 50 && Math.abs(out[idx+2] - bgB) < 50) {
      out[idx + 3] = 0;
      stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
  }

  const result = await sharp(out, { raw: { width, height, channels: 4 } })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();
  fs.writeFileSync(outPath, result);
  console.log(`[done] ${name} (${(result.length/1024).toFixed(0)}KB)`);
  return true;
}

const NEIGHBORHOODS = [
  ['downtown', 'SimCity 4 style isometric view of a dense downtown Los Angeles cityscape with many tall glass skyscrapers of various heights and colors, the tallest being 50+ stories, with a dense grid of roads between them, small cars visible, on a solid bright green #00FF00 background. Highly detailed pixel art isometric perspective from above. No text no labels.'],
  ['hollywood', 'SimCity 4 style isometric view of Hollywood Los Angeles, medium density with 3-6 story buildings, the famous Hollywood sign visible on green hills in the background, palm trees lining wide boulevards, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['beverly-hills', 'SimCity 4 style isometric view of Beverly Hills, large luxury mansions with swimming pools, manicured lawns, palm tree lined streets, low density wealthy residential area, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['venice-beach', 'SimCity 4 style isometric view of Venice Beach Los Angeles, showing the boardwalk with colorful shops, a skate park, palm trees, sandy beach meeting blue ocean water, small buildings, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['lax-airport', 'SimCity 4 style isometric view of LAX airport, showing the distinctive spider-shaped Theme Building, multiple terminals, runways with planes, control tower, parking structures, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['valley-suburban', 'SimCity 4 style isometric view of San Fernando Valley suburban neighborhood, rows of small houses with colorful roofs, green yards, wide streets, strip malls, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['koreatown', 'SimCity 4 style isometric view of Koreatown Los Angeles, dense mix of apartment buildings 4-8 stories, Korean signage on storefronts, busy streets with cars, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['port-la', 'SimCity 4 style isometric view of the Port of Los Angeles, huge red container cranes, cargo ships at dock, stacked colorful shipping containers, industrial buildings, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['santa-monica', 'SimCity 4 style isometric view of Santa Monica, the famous pier with ferris wheel extending into ocean, 3rd Street Promenade shopping area, mid-rise buildings, palm trees, beach, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['highland-park', 'SimCity 4 style isometric view of Highland Park Los Angeles, hip neighborhood with small colorful craftsman houses, trendy shops on York Boulevard, hills in background, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['south-la', 'SimCity 4 style isometric view of South Los Angeles residential neighborhood, modest homes, apartment buildings, churches, wide avenues, some commercial strips, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['arts-district', 'SimCity 4 style isometric view of the Arts District Los Angeles, converted warehouse loft buildings with street art murals, trendy restaurants, industrial-chic architecture, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['mountains', 'SimCity 4 style isometric view of green forested mountains and hills like the Santa Monica Mountains, with winding roads, scattered homes on hillsides, dense trees, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
  ['ocean', 'SimCity 4 style isometric view of Pacific Ocean water with gentle waves, deep blue color gradating to lighter blue near shore, a few small boats, on a solid bright green #00FF00 background. Isometric perspective. No text no labels.'],
];

(async () => {
  for (const [name, prompt] of NEIGHBORHOODS) {
    await gen(name, prompt);
    await new Promise(r => setTimeout(r, 1500));
  }
  console.log('\n=== ALL NEIGHBORHOODS DONE ===');
})();
