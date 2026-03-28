#!/usr/bin/env node
/**
 * Generate Clippy pixel-art sprites via Gemini API
 * Uses imagen model for high-quality sprite generation
 */

const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  // Try reading from .env
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.+)/);
    if (match) {
      process.env.GEMINI_API_KEY = match[1].trim();
    }
  }
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('No GEMINI_API_KEY found');
  process.exit(1);
}

const SPRITES_DIR = path.join(__dirname, 'public', 'sprites');
fs.mkdirSync(SPRITES_DIR, { recursive: true });

const SPRITE_PROMPTS = [
  {
    name: 'clippy-idle',
    prompt: 'A pixel art sprite of the classic Microsoft Office Clippy paperclip assistant character, standing idle with big expressive eyes looking forward, slight smile, clean pixel art style on a transparent background, 128x128 pixels, retro 32-bit era aesthetic, warm friendly expression. No text. Single character centered.'
  },
  {
    name: 'clippy-wave',
    prompt: 'A pixel art sprite of the classic Microsoft Office Clippy paperclip assistant character, waving hello with one bent wire arm raised, big happy eyes, cheerful expression, clean pixel art style on a transparent background, 128x128 pixels, retro 32-bit era aesthetic. No text. Single character centered.'
  },
  {
    name: 'clippy-thinking',
    prompt: 'A pixel art sprite of the classic Microsoft Office Clippy paperclip assistant character, in a thinking pose with one wire arm on chin, eyes looking up thoughtfully, clean pixel art style on a transparent background, 128x128 pixels, retro 32-bit era aesthetic. No text. Single character centered.'
  },
  {
    name: 'clippy-excited',
    prompt: 'A pixel art sprite of the classic Microsoft Office Clippy paperclip assistant character, jumping excitedly with both wire arms up, wide happy eyes, sparkles around, clean pixel art style on a transparent background, 128x128 pixels, retro 32-bit era aesthetic. No text. Single character centered.'
  },
  {
    name: 'clippy-reading',
    prompt: 'A pixel art sprite of the classic Microsoft Office Clippy paperclip assistant character, holding and reading a tiny document/paper, focused eyes looking down at paper, clean pixel art style on a transparent background, 128x128 pixels, retro 32-bit era aesthetic. No text. Single character centered.'
  },
  {
    name: 'clippy-sleeping',
    prompt: 'A pixel art sprite of the classic Microsoft Office Clippy paperclip assistant character, sleeping with closed eyes and a small Z floating above, leaning to one side, peaceful expression, clean pixel art style on a transparent background, 128x128 pixels, retro 32-bit era aesthetic. No text. Single character centered.'
  },
  {
    name: 'clippy-gavel',
    prompt: 'A pixel art sprite of the classic Microsoft Office Clippy paperclip assistant character, holding a tiny wooden gavel, confident expression with determined eyes, clean pixel art style on a transparent background, 128x128 pixels, retro 32-bit era aesthetic. No text. Single character centered.'
  },
  {
    name: 'clippy-pointing',
    prompt: 'A pixel art sprite of the classic Microsoft Office Clippy paperclip assistant character, pointing to the right with one wire arm extended, helpful expression with raised eyebrow, clean pixel art style on a transparent background, 128x128 pixels, retro 32-bit era aesthetic. No text. Single character centered.'
  },
];

async function generateSprite(spriteConfig) {
  const { name, prompt } = spriteConfig;
  const outputPath = path.join(SPRITES_DIR, `${name}.png`);

  if (fs.existsSync(outputPath)) {
    console.log(`  [skip] ${name}.png already exists`);
    return true;
  }

  console.log(`  [gen]  ${name}.png ...`);

  try {
    // Use Gemini's image generation via gemini-2.0-flash-preview-image-generation
    // Use Imagen 4.0 for high-quality sprite generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
          }
        })
      }
    );

    if (!response.ok) {
      // Fallback to gemini-2.5-flash-image
      console.log(`  [fall] Trying gemini-2.5-flash-image...`);
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Generate this image: ${prompt}` }]
            }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            }
          })
        }
      );

      if (!fallbackResponse.ok) {
        const errorText = await fallbackResponse.text();
        console.error(`  [err]  ${name}: HTTP ${fallbackResponse.status} - ${errorText.substring(0, 200)}`);
        return false;
      }

      const fallbackData = await fallbackResponse.json();
      const candidates = fallbackData.candidates || [];
      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            const imageData = Buffer.from(part.inlineData.data, 'base64');
            fs.writeFileSync(outputPath, imageData);
            console.log(`  [done] ${name}.png (${(imageData.length / 1024).toFixed(1)}KB) via gemini-flash`);
            return true;
          }
        }
      }
      console.error(`  [err]  ${name}: No image data in fallback response`);
      return false;
    }

    const data = await response.json();

    // Imagen returns predictions array with bytesBase64Encoded
    const predictions = data.predictions || [];
    if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
      const imageData = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');
      fs.writeFileSync(outputPath, imageData);
      console.log(`  [done] ${name}.png (${(imageData.length / 1024).toFixed(1)}KB) via imagen-4.0`);
      return true;
    }

    console.error(`  [err]  ${name}: No image data in response`);
    return false;
  } catch (err) {
    console.error(`  [err]  ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Generating Clippy sprites via Gemini API...');
  console.log(`Output: ${SPRITES_DIR}\n`);

  let success = 0;
  let failed = 0;

  // Generate sequentially to avoid rate limits
  for (const sprite of SPRITE_PROMPTS) {
    const ok = await generateSprite(sprite);
    if (ok) success++;
    else failed++;
    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nDone: ${success} generated, ${failed} failed`);
}

main();
