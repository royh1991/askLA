'use client'

import { motion } from 'framer-motion'

interface StatItem {
  label: string
  value: string
  sublabel?: string
}

interface StatCardProps {
  stats: StatItem[]
  color?: string
  source?: string
  title?: string
}

export function StatCard({ stats, color = '#6C5CE7', source, title }: StatCardProps) {
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
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`, gap: 24 }}>
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            style={{
              background: '#FFFFFF',
              border: `3px solid ${color}`,
              padding: '24px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: 36, fontWeight: 700,
              color: '#1A1A1A', lineHeight: 1,
              marginBottom: 8,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 14, fontWeight: 600,
              color: '#1A1A1A', marginBottom: 4,
            }}>
              {stat.label}
            </div>
            {stat.sublabel && (
              <div style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 12, color: '#9CA3AF',
              }}>
                {stat.sublabel}
              </div>
            )}
          </motion.div>
        ))}
      </div>
      {source && (
        <div style={{ marginTop: 16, fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF' }}>
          Source: {source} &rarr;
        </div>
      )}
    </div>
  )
}
