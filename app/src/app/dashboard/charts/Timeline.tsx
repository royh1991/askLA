'use client'

import { motion } from 'framer-motion'

interface TimelineEvent {
  date: string
  label: string
  category?: string
  color?: string
}

interface TimelineProps {
  events: TimelineEvent[]
  source?: string
  title?: string
  defaultColor?: string
}

export function Timeline({ events, source, title, defaultColor = '#6C5CE7' }: TimelineProps) {
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
      <div style={{ position: 'relative', paddingLeft: 32 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 11, top: 0, bottom: 0,
          width: 2, background: '#E5E5E0',
        }} />

        {events.map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            style={{ position: 'relative', marginBottom: 20, paddingBottom: 4 }}
          >
            {/* Dot */}
            <div style={{
              position: 'absolute', left: -27, top: 4,
              width: 12, height: 12, borderRadius: 6,
              background: event.color || defaultColor,
              border: '2px solid #F5F5F0',
            }} />

            {/* Date */}
            <div style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: 11, fontWeight: 600,
              color: '#9CA3AF', letterSpacing: '0.5px',
              marginBottom: 4,
            }}>
              {event.date}
              {event.category && (
                <span style={{
                  marginLeft: 8, padding: '2px 6px',
                  background: (event.color || defaultColor) + '18',
                  color: event.color || defaultColor,
                  fontSize: 9, fontWeight: 600,
                  letterSpacing: '1px', textTransform: 'uppercase' as const,
                }}>
                  {event.category}
                </span>
              )}
            </div>

            {/* Label */}
            <div style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 14, fontWeight: 500,
              color: '#1A1A1A', lineHeight: 1.4,
            }}>
              {event.label}
            </div>
          </motion.div>
        ))}
      </div>
      {source && (
        <div style={{ marginTop: 12, fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF' }}>
          Source: {source} &rarr;
        </div>
      )}
    </div>
  )
}
