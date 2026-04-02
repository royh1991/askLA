'use client'

import { motion } from 'framer-motion'

// ─── Horizontal Bar Chart ───────────────────────────
interface HBarDatum { label: string; value: number }

interface HBarChartProps {
  data: HBarDatum[]
  width?: number
  color?: string
  source?: string
  title?: string
  formatValue?: (v: number) => string
}

export function HBarChart({
  data, width = 700, color = '#6C5CE7', source, title,
  formatValue = (v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(0)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v.toString(),
}: HBarChartProps) {
  const max = Math.max(...data.map(d => d.value))
  const barH = 28
  const gap = 8
  const labelW = 180
  const chartH = data.length * (barH + gap)

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
        width={width} height={chartH + 8} viewBox={`0 0 ${width} ${chartH + 8}`}
        style={{ display: 'block', maxWidth: '100%' }}
        initial="hidden" whileInView="visible" viewport={{ once: true }}
      >
        {data.map((d, i) => {
          const bw = Math.max(2, (d.value / max) * (width - labelW - 80))
          const y = i * (barH + gap) + 4
          return (
            <g key={i}>
              <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize={12}
                fontFamily="var(--font-body), sans-serif" fill="#1A1A1A" fontWeight={500}>
                {d.label}
              </text>
              <motion.rect x={labelW} y={y} height={barH} fill={color} rx={0}
                initial={{ width: 0 }} whileInView={{ width: bw }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                style={{ opacity: 1 - i * 0.06 }} />
              <motion.text x={labelW + bw + 8} y={y + barH / 2 + 4} fontSize={12}
                fontFamily="var(--font-mono), monospace" fill="#6B7280" fontWeight={500}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.04 }}>
                {formatValue(d.value)}
              </motion.text>
            </g>
          )
        })}
      </motion.svg>
      {source && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 12,
          fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF',
        }}>
          <span>Source: {source} &rarr;</span>
          <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 11, color: '#D0D0D0' }}>askLA</span>
        </div>
      )}
    </div>
  )
}

// ─── Vertical Bar Chart ─────────────────────────────
interface VBarDatum { label: string; value: number }

interface VBarChartProps {
  data: VBarDatum[]
  width?: number
  height?: number
  color?: string
  source?: string
  title?: string
}

export function VBarChart({
  data, width = 700, height = 280, color = '#6C5CE7', source, title,
}: VBarChartProps) {
  const pad = { top: 16, right: 16, bottom: 40, left: 48 }
  const w = width - pad.left - pad.right
  const h = height - pad.top - pad.bottom
  const max = Math.max(...data.map(d => d.value)) * 1.1
  const barW = Math.max(8, (w - data.length * 4) / data.length)
  const gap = 4

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
        {data.map((d, i) => {
          const bh = (d.value / max) * h
          const x = pad.left + i * (barW + gap)
          return (
            <g key={i}>
              <motion.rect x={x} y={pad.top + h} width={barW} height={bh} fill={color}
                style={{ transformOrigin: 'bottom' }}
                initial={{ scaleY: 0, y: pad.top + h - bh }}
                whileInView={{ scaleY: 1, y: pad.top + h - bh }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} />
              <text x={x + barW / 2} y={pad.top + h + 20} textAnchor="middle" fontSize={10}
                fontFamily="var(--font-mono), monospace" fill="#9CA3AF">
                {d.label}
              </text>
            </g>
          )
        })}
        {/* Baseline */}
        <line x1={pad.left} y1={pad.top + h} x2={pad.left + w} y2={pad.top + h} stroke="#E5E5E0" strokeWidth={1} />
      </motion.svg>
      {source && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 12,
          fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF',
        }}>
          <span>Source: {source} &rarr;</span>
          <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 11, color: '#D0D0D0' }}>askLA</span>
        </div>
      )}
    </div>
  )
}
