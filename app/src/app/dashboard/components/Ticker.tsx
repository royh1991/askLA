'use client'

import { motion } from 'framer-motion'
import { useTickerSegments } from '../lib/pretext'
import { TICKER_FACTS } from '../data/sections'

export function Ticker() {
  const { segments, totalWidth } = useTickerSegments(
    TICKER_FACTS,
    '500 12px "Azeret Mono", monospace',
    64
  )

  if (!segments.length || !totalWidth) return <div style={{ height: 48 }} />

  const speed = 45
  const duration = totalWidth / speed

  return (
    <div
      style={{
        overflow: 'hidden',
        width: '100%',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
      }}
    >
      <motion.div
        style={{ display: 'flex', whiteSpace: 'nowrap' }}
        animate={{ x: [0, -totalWidth] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {[...segments, ...segments].map((s, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-mono), monospace',
              fontSize: 12,
              fontWeight: 500,
              color: '#6B7280',
              letterSpacing: '0.3px',
              width: s.width,
              flexShrink: 0,
              paddingLeft: 16,
            }}
          >
            {s.text}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
