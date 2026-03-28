#!/usr/bin/env node
/**
 * Process desktop icons to remove backgrounds using sharp.
 * Removes near-white and checkerboard pattern backgrounds.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SPRITES_DIR = path.join(__dirname, 'public', 'sprites');

const ICONS = [
  'icon-meetings',
  'icon-files',
  'icon-terminal',
  'icon-map',
  'icon-recycle',
  'icon-spec',
];

async function removeBackground(inputPath) {
  const image = sharp(inputPath);
  const { width, height, channels } = await image.metadata();

  // Get raw pixel data
  const raw = await image.ensureAlpha().raw().toBuffer();

  // Sample corner pixels to determine background color
  const getPixel = (x, y) => {
    const idx = (y * width + x) * 4;
    return { r: raw[idx], g: raw[idx + 1], b: raw[idx + 2], a: raw[idx + 3] };
  };

  // Sample corners and edges to find background color
  const corners = [
    getPixel(2, 2),
    getPixel(width - 3, 2),
    getPixel(2, height - 3),
    getPixel(width - 3, height - 3),
    getPixel(Math.floor(width / 2), 2),
    getPixel(2, Math.floor(height / 2)),
  ];

  // Check if background is checkerboard (transparent pattern) or solid color
  const isCheckerboard = corners.some(c =>
    (Math.abs(c.r - 204) < 15 && Math.abs(c.g - 204) < 15 && Math.abs(c.b - 204) < 15) ||
    (Math.abs(c.r - 238) < 15 && Math.abs(c.g - 238) < 15 && Math.abs(c.b - 238) < 15)
  );

  const isWhitish = corners.every(c => c.r > 220 && c.g > 220 && c.b > 220);
  const isGrayCheck = corners.some(c => c.r > 190 && c.r < 245 && Math.abs(c.r - c.g) < 10 && Math.abs(c.g - c.b) < 10);

  // Create output buffer with transparent background
  const output = Buffer.from(raw);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = output[idx], g = output[idx + 1], b = output[idx + 2];

      let makeTransparent = false;

      if (isCheckerboard || isGrayCheck) {
        // Checkerboard pattern: alternating gray/white squares
        // Both colors are neutral grays
        const isNeutralGray = Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
        const isLightGray = r > 180 && isNeutralGray;

        // Check if this pixel is part of the checkerboard border region
        // Use flood-fill-like logic: if it's gray and connected to edges
        if (isLightGray) {
          // Simple edge proximity check - pixels near edges that are gray = background
          const distFromEdge = Math.min(x, y, width - 1 - x, height - 1 - y);
          if (distFromEdge < 5) {
            makeTransparent = true;
          }
        }
      }

      if (isWhitish) {
        const isWhite = r > 240 && g > 240 && b > 240;
        const distFromEdge = Math.min(x, y, width - 1 - x, height - 1 - y);
        if (isWhite && distFromEdge < 5) {
          makeTransparent = true;
        }
      }

      if (makeTransparent) {
        output[idx + 3] = 0; // Set alpha to 0
      }
    }
  }

  // Use sharp's trim to remove transparent borders, and also try
  // a more aggressive background removal: flood fill from corners
  const trimmed = await sharp(output, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

  return trimmed;
}

async function processWithFloodFill(inputPath) {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  const raw = await image.ensureAlpha().raw().toBuffer();
  const output = Buffer.from(raw);

  const getIdx = (x, y) => (y * width + x) * 4;
  const visited = new Uint8Array(width * height);

  // Get corner color as reference background
  const bgR = raw[0], bgG = raw[1], bgB = raw[2];

  function colorMatch(idx, tolerance) {
    return Math.abs(raw[idx] - bgR) < tolerance &&
           Math.abs(raw[idx + 1] - bgG) < tolerance &&
           Math.abs(raw[idx + 2] - bgB) < tolerance;
  }

  // Flood fill from all 4 corners
  const stack = [];
  const startPoints = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [Math.floor(width / 2), 0], [0, Math.floor(height / 2)],
    [Math.floor(width / 2), height - 1], [width - 1, Math.floor(height / 2)],
  ];

  for (const [sx, sy] of startPoints) {
    stack.push([sx, sy]);
  }

  const tolerance = 40;

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const visitIdx = y * width + x;
    if (visited[visitIdx]) continue;
    visited[visitIdx] = 1;

    const idx = getIdx(x, y);
    if (!colorMatch(idx, tolerance) && raw[idx + 3] > 10) continue;

    // Make transparent
    output[idx + 3] = 0;

    // Add neighbors
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Also handle semi-transparent edges (anti-aliasing)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const visitIdx = y * width + x;
      if (visited[visitIdx]) continue;

      // Check if surrounded by transparent pixels
      let transparentNeighbors = 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nVisitIdx = ny * width + nx;
          if (visited[nVisitIdx]) transparentNeighbors++;
        }
      }

      if (transparentNeighbors >= 3) {
        const idx = getIdx(x, y);
        if (colorMatch(idx, tolerance + 20)) {
          output[idx + 3] = 0;
        }
      }
    }
  }

  return sharp(output, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

async function main() {
  console.log('Processing icons for transparent backgrounds...');

  for (const icon of ICONS) {
    const inputPath = path.join(SPRITES_DIR, `${icon}.png`);
    if (!fs.existsSync(inputPath)) {
      console.log(`  [skip] ${icon}.png not found`);
      continue;
    }

    try {
      const result = await processWithFloodFill(inputPath);
      const outputPath = path.join(SPRITES_DIR, `${icon}.png`);
      fs.writeFileSync(outputPath, result);
      const origSize = fs.statSync(inputPath).size;
      console.log(`  [done] ${icon}.png (${(result.length / 1024).toFixed(0)}KB)`);
    } catch (err) {
      console.log(`  [err]  ${icon}: ${err.message}`);
    }
  }

  console.log('Done!');
}

main();
