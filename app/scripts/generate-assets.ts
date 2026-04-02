/**
 * Gemini Asset Generation Script
 *
 * Generates isometric illustrations for each dashboard section using
 * the Gemini image generation API.
 *
 * Usage:
 *   npx tsx app/scripts/generate-assets.ts
 *   npx tsx app/scripts/generate-assets.ts --section budget
 *
 * Requires: GEMINI_API_KEY in .env
 * Output: app/public/sprites/dashboard/section-{id}.png
 */

import fs from 'fs'
import path from 'path'

const SECTIONS = [
  { id: 'budget', title: 'Budget & Spending', color: '#6C5CE7', subject: 'a city hall building with dollar bills and coins flowing through it, representing government budget allocation' },
  { id: 'accountability', title: 'Accountability', color: '#D63031', subject: 'a large magnifying glass examining a financial ledger book with small red warning flags popping up' },
  { id: 'campaign', title: 'Campaign Finance', color: '#A855F7', subject: 'a ballot box with dollar bills flowing in from one side and flowing out the other side' },
  { id: 'policing', title: 'Policing & Justice', color: '#1E3A5F', subject: 'a police badge next to a courthouse building with scales of justice' },
  { id: 'safety', title: 'Safety', color: '#E84855', subject: 'a traffic light showing red next to an ambulance vehicle on a road' },
  { id: 'housing', title: 'Housing & Homelessness', color: '#00B894', subject: 'an apartment building under construction with a crane and scaffolding' },
  { id: 'people', title: 'People & Demographics', color: '#0984E3', subject: 'a diverse group of simplified human figures standing together as a community' },
  { id: 'health', title: 'Health & Environment', color: '#00CEC9', subject: 'a healthy green tree on one side and a factory with smokestacks on the other side' },
  { id: 'infrastructure', title: 'Infrastructure', color: '#FDCB6E', subject: 'a road with a parking meter, fire hydrant, and street lamp along the sidewalk' },
  { id: 'governance', title: 'Governance', color: '#636E72', subject: 'a judge gavel on top of a stack of official government documents' },
]

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'sprites', 'dashboard')

function buildPrompt(subject: string, accentColor: string): string {
  return `Create a simple isometric illustration of ${subject}. Use a flat, minimal geometric style with clean lines. Use only these colors: black (#000000), dark gray (#333333), light gray (#CCCCCC), and accent color ${accentColor}. The illustration should be on a pure white background with no text, no shadows, no gradients. Keep shapes simple and geometric. Isometric perspective (30-degree angle). Style reference: USAFacts.org editorial illustrations. The image should be clean and professional, suitable for a civic data platform.`
}

async function generateImage(sectionId: string, prompt: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set')
    return false
  }

  try {
    console.log(`  Generating: ${sectionId}...`)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            responseMimeType: 'image/png',
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error(`  API error for ${sectionId}: ${response.status} ${errText.slice(0, 200)}`)
      return false
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))

    if (!imagePart) {
      console.error(`  No image in response for ${sectionId}`)
      // Try alternative Imagen model
      return await generateWithImagen(sectionId, prompt, outputPath, apiKey)
    }

    const imageData = Buffer.from(imagePart.inlineData.data, 'base64')
    fs.writeFileSync(outputPath, imageData)
    console.log(`  Saved: ${outputPath} (${(imageData.length / 1024).toFixed(0)}KB)`)
    return true
  } catch (err) {
    console.error(`  Error for ${sectionId}:`, err)
    return false
  }
}

async function generateWithImagen(sectionId: string, prompt: string, outputPath: string, apiKey: string): Promise<boolean> {
  try {
    console.log(`  Trying Imagen for ${sectionId}...`)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: '1:1', personGeneration: 'DONT_ALLOW' },
        }),
      }
    )

    if (!response.ok) {
      console.error(`  Imagen API error: ${response.status}`)
      return false
    }

    const data = await response.json()
    const imageBytes = data.predictions?.[0]?.bytesBase64Encoded
    if (!imageBytes) {
      console.error(`  No image from Imagen for ${sectionId}`)
      return false
    }

    const imageData = Buffer.from(imageBytes, 'base64')
    fs.writeFileSync(outputPath, imageData)
    console.log(`  Saved (Imagen): ${outputPath} (${(imageData.length / 1024).toFixed(0)}KB)`)
    return true
  } catch (err) {
    console.error(`  Imagen error for ${sectionId}:`, err)
    return false
  }
}

function generatePlaceholder(sectionId: string, color: string, outputPath: string) {
  // Generate a simple SVG placeholder and save as the fallback
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#FAFAFA"/>
  <rect x="120" y="100" width="160" height="200" fill="${color}" opacity="0.2" transform="skewX(-10)"/>
  <rect x="140" y="120" width="120" height="160" fill="${color}" opacity="0.4" transform="skewX(-10)"/>
  <rect x="160" y="140" width="80" height="120" fill="${color}" opacity="0.6" transform="skewX(-10)"/>
  <text x="200" y="350" text-anchor="middle" font-family="monospace" font-size="12" fill="#999">${sectionId}</text>
</svg>`

  // Write as SVG (browsers handle this fine)
  const svgPath = outputPath.replace('.png', '.svg')
  fs.writeFileSync(svgPath, svg)
  console.log(`  Placeholder: ${svgPath}`)
}

async function main() {
  // Load .env from project root
  const envPath = path.join(__dirname, '..', '..', '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^#=]+)=(.+)$/)
      if (match) {
        const key = match[1].trim()
        const val = match[2].trim().replace(/^['"]|['"]$/g, '')
        if (!process.env[key]) process.env[key] = val
      }
    }
  }

  const targetSection = process.argv.find(a => a.startsWith('--section='))?.split('=')[1]
    || (process.argv.includes('--section') ? process.argv[process.argv.indexOf('--section') + 1] : null)

  const sections = targetSection
    ? SECTIONS.filter(s => s.id === targetSection)
    : SECTIONS

  if (!sections.length) {
    console.error(`Unknown section: ${targetSection}`)
    process.exit(1)
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log(`Generating ${sections.length} illustrations...`)
  console.log(`Output: ${OUTPUT_DIR}\n`)

  let success = 0
  let failed = 0

  for (const section of sections) {
    const outputPath = path.join(OUTPUT_DIR, `section-${section.id}.png`)
    const prompt = buildPrompt(section.subject, section.color)

    const ok = await generateImage(section.id, prompt, outputPath)
    if (ok) {
      success++
    } else {
      failed++
      generatePlaceholder(section.id, section.color, outputPath)
    }

    // Rate limit: small delay between requests
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log(`\nDone: ${success} generated, ${failed} placeholders`)

  // Generate manifest
  const manifest = {
    generated: new Date().toISOString(),
    sections: SECTIONS.map(s => ({
      id: s.id,
      title: s.title,
      file: `section-${s.id}.png`,
      svgFallback: `section-${s.id}.svg`,
    })),
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log('Manifest written to manifest.json')
}

main().catch(console.error)
