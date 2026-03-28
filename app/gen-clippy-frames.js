#!/usr/bin/env node
/**
 * Generate individual Clippy animation frames via Gemini,
 * then composite into a sprite strip. Uses magenta (#FF00FF)
 * chroma key for clean background removal.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, 'public', 'sprites');

// Read API key from environment or .env
let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    API_KEY = envContent.match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();
  }
}
if (!API_KEY) { console.error('No GEMINI_API_KEY found. Set it via environment or .env'); process.exit(1); }

async function generateImage(prompt) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '1:1' }
    })
  });
  const d = await r.json();
  if (d.predictions?.[0]?.bytesBase64Encoded) {
    return Buffer.from(d.predictions[0].bytesBase64Encoded, 'base64');
  }
  return null;
}

async function chromaKey(buf, threshold = 120) {
  const { width, height } = await sharp(buf).metadata();
  const raw = await sharp(buf).ensureAlpha().raw().toBuffer();
  const out = Buffer.from(raw);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = out[idx], g = out[idx + 1], b = out[idx + 2];

    // Magenta removal: high red, low green, high blue
    if (r > 150 && g < threshold && b > 150 && (r + b) / 2 - g > 80) {
      out[idx + 3] = 0;
    }
    // Also remove near-magenta (anti-alias edges)
    else if (r > 130 && g < threshold + 30 && b > 130 && (r + b) / 2 - g > 50) {
      const magentaness = ((r + b) / 2 - g) / 255;
      out[idx + 3] = Math.round(255 * Math.max(0, 1 - magentaness * 2));
    }
  }

  // Also flood-fill from corners for any remaining background
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
    // If already transparent or very close to transparent
    if (out[idx + 3] < 30) {
      out[idx + 3] = 0;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      continue;
    }
    // If it's a near-background color (close to corner color)
    const cornerR = raw[0], cornerG = raw[1], cornerB = raw[2];
    if (Math.abs(out[idx] - cornerR) < 40 && Math.abs(out[idx + 1] - cornerG) < 40 && Math.abs(out[idx + 2] - cornerB) < 40) {
      out[idx + 3] = 0;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function verifyTransparency(buf, name) {
  const { width, height } = await sharp(buf).metadata();
  const raw = await sharp(buf).ensureAlpha().raw().toBuffer();

  // Check corners
  const corners = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [5, 5], [width - 6, 5], [5, height - 6], [width - 6, height - 6],
  ];

  let opaqueCorners = 0;
  for (const [x, y] of corners) {
    const idx = (y * width + x) * 4;
    if (raw[idx + 3] > 10) opaqueCorners++;
  }

  if (opaqueCorners > 2) {
    console.log(`  [WARN] ${name}: ${opaqueCorners}/8 corners are opaque — background may not be fully removed`);
    return false;
  }
  console.log(`  [OK]   ${name}: corners transparent (${opaqueCorners}/8 opaque)`);
  return true;
}

// Character description to keep consistent across frames
const CLIPPY_BASE = 'the classic Microsoft Office Clippy paperclip assistant character, a shiny silver bent paperclip with two large round white eyes with black pupils, expressive eyebrows, pixelated retro style';

const ANIMATIONS = {
  idle: {
    frames: [
      `${CLIPPY_BASE}, standing still facing forward with eyes wide open and a friendly smile, on a solid magenta #FF00FF background, no text no labels no watermarks`,
      `${CLIPPY_BASE}, standing still facing forward with eyes slightly squinting starting to blink, on a solid magenta #FF00FF background, no text no labels no watermarks`,
      `${CLIPPY_BASE}, standing still facing forward with eyes fully closed in a blink, on a solid magenta #FF00FF background, no text no labels no watermarks`,
      `${CLIPPY_BASE}, standing still facing forward with eyes opening back up after a blink, on a solid magenta #FF00FF background, no text no labels no watermarks`,
    ],
  },
  wave: {
    frames: [
      `${CLIPPY_BASE}, with one wire arm raised up waving hello cheerfully, on a solid magenta #FF00FF background, no text no labels no watermarks`,
      `${CLIPPY_BASE}, with one wire arm extended to the right in mid-wave, on a solid magenta #FF00FF background, no text no labels no watermarks`,
      `${CLIPPY_BASE}, with one wire arm raised up waving hello the other direction, on a solid magenta #FF00FF background, no text no labels no watermarks`,
      `${CLIPPY_BASE}, with both wire arms down returning to normal standing pose, on a solid magenta #FF00FF background, no text no labels no watermarks`,
    ],
  },
  think: {
    frames: [
      `${CLIPPY_BASE}, with one wire arm on chin in a thinking pose looking upward thoughtfully, on a solid magenta #FF00FF background, no text no labels no watermarks`,
      `${CLIPPY_BASE}, with one wire arm on chin thinking and eyes looking to the left, on a solid magenta #FF00FF background, no text no labels no watermarks`,
      `${CLIPPY_BASE}, with one wire arm on chin thinking and eyes looking to the right, on a solid magenta #FF00FF background, no text no labels no watermarks`,
      `${CLIPPY_BASE}, with a lightbulb appearing above head in eureka moment, excited eyes, on a solid magenta #FF00FF background, no text no labels no watermarks`,
    ],
  },
};

async function generateAnimation(animName, config) {
  console.log(`\n[ANIM] Generating ${animName} (${config.frames.length} frames)...`);
  const frameBufs = [];

  for (let i = 0; i < config.frames.length; i++) {
    console.log(`  [frame ${i + 1}/${config.frames.length}]`);
    const imgBuf = await generateImage(config.frames[i]);
    if (!imgBuf) {
      console.log(`  [ERR] Frame ${i} failed to generate`);
      return false;
    }

    // Chroma key removal
    const transparent = await chromaKey(imgBuf);

    // Resize to consistent 200x200
    const resized = await sharp(transparent)
      .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const ok = await verifyTransparency(resized, `${animName}-frame${i}`);
    frameBufs.push(resized);

    // Rate limit
    await new Promise(r => setTimeout(r, 1200));
  }

  // Stitch frames into horizontal strip
  const frameW = 200, frameH = 200;
  const stripW = frameW * frameBufs.length;

  const strip = sharp({
    create: { width: stripW, height: frameH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  });

  const composites = frameBufs.map((buf, i) => ({
    input: buf,
    left: i * frameW,
    top: 0,
  }));

  const result = await strip.composite(composites).png().toBuffer();
  const outPath = path.join(DIR, `clippy-anim-${animName}.png`);
  fs.writeFileSync(outPath, result);
  await verifyTransparency(result, `${animName}-strip`);
  console.log(`  [DONE] ${outPath} (${(result.length / 1024).toFixed(0)}KB, ${stripW}x${frameH})`);
  return true;
}

async function main() {
  console.log('=== Clippy Animation Frame Generator ===');
  console.log('Using magenta chroma key + flood fill for clean transparency\n');

  for (const [name, config] of Object.entries(ANIMATIONS)) {
    await generateAnimation(name, config);
  }

  // Also reprocess static sprites with better chroma key
  console.log('\n[STATIC] Reprocessing static sprites...');
  const statics = ['clippy-idle', 'clippy-wave', 'clippy-thinking', 'clippy-excited',
    'clippy-reading', 'clippy-sleeping', 'clippy-gavel', 'clippy-pointing'];
  for (const name of statics) {
    const p = path.join(DIR, `${name}.png`);
    if (!fs.existsSync(p)) continue;
    const buf = fs.readFileSync(p);
    const { width, height } = await sharp(buf).metadata();
    const raw = await sharp(buf).ensureAlpha().raw().toBuffer();
    const out = Buffer.from(raw);

    // Aggressive flood fill from all edges
    const visited = new Uint8Array(width * height);
    const bgR = raw[0], bgG = raw[1], bgB = raw[2];
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
      const dr = Math.abs(out[idx] - bgR);
      const dg = Math.abs(out[idx + 1] - bgG);
      const db = Math.abs(out[idx + 2] - bgB);
      if (dr < 55 && dg < 55 && db < 55) {
        out[idx + 3] = 0;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    const result = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
    fs.writeFileSync(p, result);
    await verifyTransparency(result, name);
  }

  console.log('\n=== All done! ===');
}

main().catch(console.error);
