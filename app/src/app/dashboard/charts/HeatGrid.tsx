'use client'

import { motion } from 'framer-motion'

interface HeatGridProps {
  data: { label?: string; value: number }[]
  cols?: number
  cellSize?: number
  gap?: number
  color?: string
  source?: string
  title?: string
}

export function HeatGrid({
  data, cols = 8, cellSize = 28, gap = 3, color = '#0984E3',
  source, title,
}: HeatGridProps) {
  const max = Math.max(...data.map(d => d.value))
  const min = Math.min(...data.map(d => d.value))
  const range = max - min || 1
  const rows = Math.ceil(data.length / cols)
  const w = cols * (cellSize + gap) - gap
  const h = rows * (cellSize + gap) - gap

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
        width={w} height={h} viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block' }}
        initial="hidden" whileInView="visible" viewport={{ once: true }}
      >
        {data.map((d, i) => {
          const c = i % cols
          const r = Math.floor(i / cols)
          const pct = (d.value - min) / range
          return (
            <motion.rect key={i}
              x={c * (cellSize + gap)} y={r * (cellSize + gap)}
              width={cellSize} height={cellSize}
              fill={color} opacity={0.1 + pct * 0.8}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.01 }}
            />
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
