'use client'

import { motion } from 'framer-motion'

interface TreemapDatum { label: string; value: number; color?: string }

interface TreemapProps {
  data: TreemapDatum[]
  width?: number
  height?: number
  colors?: string[]
  source?: string
  title?: string
  formatValue?: (v: number) => string
}

const DEFAULT_COLORS = ['#6C5CE7', '#A855F7', '#7C3AED', '#8B5CF6', '#6D28D9', '#5B21B6', '#4C1D95', '#9333EA']

export function Treemap({
  data, width = 700, height = 300, colors, source, title,
  formatValue = (v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(0)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`,
}: TreemapProps) {
  const palette = colors || DEFAULT_COLORS
  const total = data.reduce((s, d) => s + d.value, 0)
  const sorted = [...data].sort((a, b) => b.value - a.value)

  // Simple squarified treemap layout (single row for simplicity)
  const rects: { x: number; y: number; w: number; h: number; datum: TreemapDatum; i: number }[] = []

  // Split into 2 rows if > 4 items
  if (sorted.length <= 4) {
    let x = 0
    sorted.forEach((d, i) => {
      const w = (d.value / total) * width
      rects.push({ x, y: 0, w: w - 2, h: height - 2, datum: d, i })
      x += w
    })
  } else {
    // Top row: first half by value
    const mid = Math.ceil(sorted.length / 2)
    const topItems = sorted.slice(0, mid)
    const botItems = sorted.slice(mid)
    const topTotal = topItems.reduce((s, d) => s + d.value, 0)
    const botTotal = botItems.reduce((s, d) => s + d.value, 0)
    const topH = (topTotal / total) * height
    const botH = height - topH

    let x = 0
    topItems.forEach((d, i) => {
      const w = (d.value / topTotal) * width
      rects.push({ x, y: 0, w: w - 2, h: topH - 2, datum: d, i })
      x += w
    })
    x = 0
    botItems.forEach((d, i) => {
      const w = (d.value / botTotal) * width
      rects.push({ x, y: topH, w: w - 2, h: botH - 2, datum: d, i: mid + i })
      x += w
    })
  }

  return (
    <div style={{ background: '#F5F5F0', padding: 24 }}>
      {title && (
        <div style={{
          fontFamily: 'var(--font-body), sans-serif', fontSize: 15, fontWeight: 600,
          color: '#1A1A1A', marginBottom: 16,
        }}>
          {title}
        </div>
      )}
      <motion.svg
        width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', maxWidth: '100%' }}
        initial="hidden" whileInView="visible" viewport={{ once: true }}
      >
        {rects.map((r) => {
          const c = r.datum.color || palette[r.i % palette.length]
          const showLabel = r.w > 60 && r.h > 40
          return (
            <g key={r.i}>
              <motion.rect x={r.x} y={r.y} width={r.w} height={r.h} fill={c}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: r.i * 0.05 }} />
              {showLabel && (
                <>
                  <text x={r.x + 8} y={r.y + 20} fontSize={12} fontWeight={700}
                    fontFamily="var(--font-mono), monospace" fill="rgba(255,255,255,0.95)">
                    {formatValue(r.datum.value)}
                  </text>
                  <text x={r.x + 8} y={r.y + 36} fontSize={11}
                    fontFamily="var(--font-body), sans-serif" fill="rgba(255,255,255,0.7)">
                    {r.datum.label.length > r.w / 7 ? r.datum.label.slice(0, Math.floor(r.w / 7)) + '...' : r.datum.label}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </motion.svg>
      {source && (
        <div style={{ marginTop: 12, fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF' }}>
          Source: {source} &rarr;
        </div>
      )}
    </div>
  )
}
