'use client'

import { motion } from 'framer-motion'

interface GaugeProps {
  value: number
  max?: number
  size?: number
  color?: string
  label?: string
  source?: string
  title?: string
}

export function Gauge({
  value, max = 100, size = 200, color = '#00B894', label, source, title,
}: GaugeProps) {
  const pct = Math.min(value / max, 1)
  const sw = 16
  const r = (size - sw) / 2
  const halfCirc = Math.PI * r

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.svg
          width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}
          initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          {/* Background arc */}
          <path
            d={`M${sw / 2},${size / 2} A${r},${r} 0 0 1 ${size - sw / 2},${size / 2}`}
            fill="none" stroke="#E5E5E0" strokeWidth={sw} strokeLinecap="round" />
          {/* Value arc */}
          <motion.path
            d={`M${sw / 2},${size / 2} A${r},${r} 0 0 1 ${size - sw / 2},${size / 2}`}
            fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={halfCirc}
            initial={{ strokeDashoffset: halfCirc }}
            whileInView={{ strokeDashoffset: halfCirc * (1 - pct) }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} />
          {/* Center value */}
          <text x={size / 2} y={size / 2 - 8} textAnchor="middle" dominantBaseline="central"
            fontSize={36} fontWeight={700} fill="#1A1A1A"
            fontFamily="var(--font-mono), monospace">
            {value}{max === 100 ? '%' : ''}
          </text>
        </motion.svg>
        {label && (
          <div style={{
            fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: '#6B7280',
            marginTop: -8,
          }}>
            {label}
          </div>
        )}
      </div>
      {source && (
        <div style={{ marginTop: 16, fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
          Source: {source} &rarr;
        </div>
      )}
    </div>
  )
}
