'use client'

import { motion } from 'framer-motion'

interface DataPoint { x: string; y: number }
interface Band { x1: number; x2: number; label?: string }

interface LineChartProps {
  data: DataPoint[]
  width?: number
  height?: number
  color?: string
  areaFill?: boolean
  bands?: Band[] // shaded regions (e.g. recession, COVID)
  yLabel?: string
  source?: string
  title?: string
}

export function LineChart({
  data, width = 700, height = 320, color = '#6C5CE7',
  areaFill = true, bands, yLabel, source, title,
}: LineChartProps) {
  if (data.length < 2) return null

  const pad = { top: 40, right: 24, bottom: 56, left: 64 }
  const w = width - pad.left - pad.right
  const h = height - pad.top - pad.bottom

  const vals = data.map(d => d.y)
  const max = Math.max(...vals) * 1.1
  const min = Math.min(0, Math.min(...vals))
  const range = max - min || 1

  const pts = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * w,
    y: pad.top + (1 - (d.y - min) / range) * h,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${pad.top + h} L${pts[0].x},${pad.top + h} Z`

  // Y-axis ticks
  const yTicks = 5
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => min + (range * i) / yTicks)

  // X-axis labels (show ~6)
  const xStep = Math.max(1, Math.floor(data.length / 6))

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
        {/* Grid lines */}
        {yTickVals.map((v, i) => {
          const y = pad.top + (1 - (v - min) / range) * h
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={pad.left + w} y2={y} stroke="#E5E5E0" strokeWidth={1} />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize={11}
                fontFamily="var(--font-mono), monospace" fill="#9CA3AF">
                {v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v.toFixed(0)}
              </text>
            </g>
          )
        })}

        {/* Bands (recession/COVID shading) */}
        {bands?.map((band, i) => {
          const x1 = pad.left + (band.x1 / (data.length - 1)) * w
          const x2 = pad.left + (band.x2 / (data.length - 1)) * w
          return (
            <g key={`band-${i}`}>
              <rect x={x1} y={pad.top} width={x2 - x1} height={h} fill="#1A1A1A" opacity={0.06} />
              {band.label && (
                <text x={x1 + 4} y={pad.top + 14} fontSize={10} fill="#9CA3AF"
                  fontFamily="var(--font-mono), monospace" style={{ writingMode: 'vertical-rl' } as any}>
                  {band.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Area fill */}
        {areaFill && (
          <motion.path d={areaPath} fill={color} opacity={0.08}
            initial={{ opacity: 0 }} animate={{ opacity: 0.08 }}
            transition={{ duration: 1, delay: 0.5 }} />
        )}

        {/* Line */}
        <motion.path d={linePath} fill="none" stroke={color} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }} />

        {/* End dot */}
        <motion.circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4} fill={color}
          initial={{ scale: 0 }} whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 1.5 }} />

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % xStep !== 0 && i !== data.length - 1) return null
          return (
            <text key={i} x={pts[i].x} y={pad.top + h + 24} textAnchor="middle"
              fontSize={11} fontFamily="var(--font-mono), monospace" fill="#9CA3AF">
              {d.x}
            </text>
          )
        })}

        {/* Y label */}
        {yLabel && (
          <text x={12} y={pad.top + h / 2} textAnchor="middle" fontSize={11}
            fontFamily="var(--font-mono), monospace" fill="#9CA3AF"
            transform={`rotate(-90, 12, ${pad.top + h / 2})`}>
            {yLabel}
          </text>
        )}
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
