'use client'

import { motion } from 'framer-motion'

interface FunnelStep {
  label: string
  value: number
  sublabel?: string
}

interface FunnelChartProps {
  steps: FunnelStep[]
  width?: number
  color?: string
  source?: string
  title?: string
  formatValue?: (v: number) => string
}

export function FunnelChart({
  steps, width = 600, color = '#6C5CE7', source, title,
  formatValue = (v) => v.toLocaleString(),
}: FunnelChartProps) {
  const maxValue = Math.max(...steps.map(s => s.value))
  const stepH = 52
  const gap = 4
  const totalH = steps.length * (stepH + gap)

  return (
    <div style={{ background: '#F5F5F0', padding: 24 }}>
      {title && (
        <div style={{
          fontFamily: 'var(--font-body), sans-serif', fontSize: 15, fontWeight: 600,
          color: '#1A1A1A', marginBottom: 24,
        }}>
          {title}
        </div>
      )}
      <div style={{ maxWidth: width, margin: '0 auto' }}>
        {steps.map((step, i) => {
          const pct = step.value / maxValue
          const barW = Math.max(80, pct * 100)
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                marginBottom: gap, transformOrigin: 'left',
              }}
            >
              <div style={{
                width: `${barW}%`, height: stepH,
                background: color,
                opacity: 1 - i * 0.12,
                display: 'flex', alignItems: 'center',
                padding: '0 16px',
                position: 'relative',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: 16, fontWeight: 700,
                  color: '#FFFFFF',
                }}>
                  {formatValue(step.value)}
                </span>
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-body), sans-serif',
                  fontSize: 14, fontWeight: 600, color: '#1A1A1A',
                }}>
                  {step.label}
                </div>
                {step.sublabel && (
                  <div style={{
                    fontFamily: 'var(--font-body), sans-serif',
                    fontSize: 12, color: '#9CA3AF',
                  }}>
                    {step.sublabel}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
      {source && (
        <div style={{ marginTop: 16, fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF' }}>
          Source: {source} &rarr;
        </div>
      )}
    </div>
  )
}
