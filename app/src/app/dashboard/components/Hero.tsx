'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useResponsiveText } from '../lib/pretext'

const ROTATING_QUESTIONS = [
  "Where does LA spend $13.2B?",
  "Who gets $1.42B in homelessness funds?",
  "Which nonprofits are 100% city-dependent?",
  "Do city payments follow Benford's Law?",
  "Is LAPD overtime an off-books expansion?",
]

export function Hero() {
  const [qIndex, setQIndex] = useState(0)
  const tagline = 'Answers straight from the source. The data LA deserves.'
  const { containerRef, height: taglineHeight } = useResponsiveText(
    tagline,
    '800 48px "Rethink Sans", sans-serif',
    56
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setQIndex((i) => (i + 1) % ROTATING_QUESTIONS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        background: '#6C5CE7',
        padding: '80px 0 96px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 32px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        {/* Left: tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 56,
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.1,
              margin: '0 0 16px',
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ position: 'relative', display: 'inline' }}>
              <span
                style={{
                  position: 'absolute',
                  inset: '-4px -8px',
                  background: '#E84855',
                  zIndex: 0,
                }}
              />
              <span style={{ position: 'relative', zIndex: 1 }}>Answers</span>
            </span>{' '}
            straight from the source. The data LA deserves.
          </h1>
          {/* Pretext-measured container for responsive reflow tracking */}
          <div ref={containerRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
            {tagline}
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 16,
              color: 'rgba(255,255,255,0.8)',
              margin: '24px 0 0',
              lineHeight: 1.5,
            }}
          >
            24 tables. 2.19M rows. 30+ data sources. 18 years of city records.
          </p>
        </motion.div>

        {/* Right: rotating question card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '3px solid #1A1A1A',
              padding: 32,
              maxWidth: 400,
              width: '100%',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase' as const,
                color: '#6B7280',
                marginBottom: 16,
              }}
            >
              TRENDING QUESTION
            </div>
            <motion.div
              key={qIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 24,
                fontWeight: 700,
                color: '#1A1A1A',
                lineHeight: 1.3,
              }}
            >
              {ROTATING_QUESTIONS[qIndex]}
            </motion.div>
            <div
              style={{
                marginTop: 24,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: '#6C5CE7',
                cursor: 'pointer',
              }}
            >
              Get the facts <span style={{ fontSize: 18 }}>&rarr;</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
