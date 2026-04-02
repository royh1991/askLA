'use client'

import { motion } from 'framer-motion'

interface DonutDatum { label: string; value: number; color?: string }

interface DonutChartProps {
  data: DonutDatum[]
  size?: number
  strokeWidth?: number
  colors?: string[]
  source?: string
  title?: string
  centerLabel?: string
  centerValue?: string
}

const DEFAULT_COLORS = ['#6C5CE7', '#E84855', '#00B894', '#0984E3', '#FDCB6E', '#A855F7', '#636E72', '#00CEC9']

export function DonutChart({
  data, size = 220, strokeWidth = 32, colors, source, title,
  centerLabel, centerValue,
}: DonutChartProps) {
  const palette = colors || DEFAULT_COLORS
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  let offset = 0

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
      <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
        <motion.svg
          width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          {data.map((d, i) => {
            const pct = d.value / total
            const dash = pct * circ
            const rot = (offset / total) * 360 - 90
            offset += d.value
            return (
              <motion.circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={d.color || palette[i % palette.length]} strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circ - dash}`}
                transform={`rotate(${rot} ${size / 2} ${size / 2})`}
                initial={{ strokeDashoffset: dash }}
                whileInView={{ strokeDashoffset: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.08 }} />
            )
          })}
          {centerValue && (
            <>
              <text x={size / 2} y={size / 2 - 4} textAnchor="middle" dominantBaseline="central"
                fontSize={28} fontWeight={700} fill="#1A1A1A"
                fontFamily="var(--font-mono), monospace">
                {centerValue}
              </text>
              {centerLabel && (
                <text x={size / 2} y={size / 2 + 20} textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fill="#9CA3AF" fontFamily="var(--font-mono), monospace">
                  {centerLabel}
                </text>
              )}
            </>
          )}
        </motion.svg>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 12, height: 12,
                background: d.color || palette[i % palette.length],
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: '#1A1A1A' }}>
                {d.label}
              </span>
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: '#9CA3AF', marginLeft: 'auto', paddingLeft: 12 }}>
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      {source && (
        <div style={{ marginTop: 16, fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF' }}>
          Source: {source} &rarr;
        </div>
      )}
    </div>
  )
}
