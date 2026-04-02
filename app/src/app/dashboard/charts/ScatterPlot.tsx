'use client'

import { motion } from 'framer-motion'

interface ScatterDatum { x: number; y: number; label?: string; size?: number }

interface ScatterPlotProps {
  data: ScatterDatum[]
  width?: number
  height?: number
  color?: string
  xLabel?: string
  yLabel?: string
  source?: string
  title?: string
  thresholdY?: number // horizontal threshold line
  thresholdLabel?: string
}

export function ScatterPlot({
  data, width = 700, height = 320, color = '#6C5CE7',
  xLabel, yLabel, source, title, thresholdY, thresholdLabel,
}: ScatterPlotProps) {
  if (!data.length) return null

  const pad = { top: 24, right: 24, bottom: 48, left: 56 }
  const w = width - pad.left - pad.right
  const h = height - pad.top - pad.bottom

  const xs = data.map(d => d.x), ys = data.map(d => d.y)
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)]
  const [minY, maxY] = [Math.min(0, Math.min(...ys)), Math.max(...ys) * 1.1]
  const rX = maxX - minX || 1, rY = maxY - minY || 1

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
        {/* Axes */}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + h} stroke="#E5E5E0" strokeWidth={1} />
        <line x1={pad.left} y1={pad.top + h} x2={pad.left + w} y2={pad.top + h} stroke="#E5E5E0" strokeWidth={1} />

        {/* Threshold line */}
        {thresholdY !== undefined && (
          <>
            <line
              x1={pad.left} x2={pad.left + w}
              y1={pad.top + (1 - (thresholdY - minY) / rY) * h}
              y2={pad.top + (1 - (thresholdY - minY) / rY) * h}
              stroke="#E84855" strokeWidth={1.5} strokeDasharray="6 4" />
            {thresholdLabel && (
              <text x={pad.left + w - 4} y={pad.top + (1 - (thresholdY - minY) / rY) * h - 6}
                textAnchor="end" fontSize={10} fill="#E84855"
                fontFamily="var(--font-mono), monospace">
                {thresholdLabel}
              </text>
            )}
          </>
        )}

        {/* Dots */}
        {data.map((d, i) => {
          const cx = pad.left + ((d.x - minX) / rX) * w
          const cy = pad.top + (1 - (d.y - minY) / rY) * h
          const r = d.size || 5
          return (
            <motion.circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity={0.6}
              initial={{ scale: 0 }} whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.01 }} />
          )
        })}

        {/* Axis labels */}
        {xLabel && (
          <text x={pad.left + w / 2} y={height - 8} textAnchor="middle" fontSize={11}
            fontFamily="var(--font-mono), monospace" fill="#9CA3AF">{xLabel}</text>
        )}
        {yLabel && (
          <text x={12} y={pad.top + h / 2} textAnchor="middle" fontSize={11}
            fontFamily="var(--font-mono), monospace" fill="#9CA3AF"
            transform={`rotate(-90, 12, ${pad.top + h / 2})`}>{yLabel}</text>
        )}
      </motion.svg>
      {source && (
        <div style={{ marginTop: 12, fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF' }}>
          Source: {source} &rarr;
        </div>
      )}
    </div>
  )
}
