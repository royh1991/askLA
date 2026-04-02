'use client'

import { motion } from 'framer-motion'
import { TRENDING_QUESTIONS } from '../data/sections'

const FEATURED = [
  {
    label: 'INVESTIGATION',
    title: 'The Money Trail',
    description: 'Follow $7B in city spending from source to recipient. Who lobbies, donates, and gets contracts?',
    color: '#6C5CE7',
    textColor: '#FFFFFF',
  },
  {
    label: 'CRISIS',
    title: 'The Housing Crisis',
    description: '$1.8B spent on homelessness. 13,277 unreinforced buildings. Where is LA building, and who profits?',
    color: '#00B894',
    textColor: '#FFFFFF',
  },
  {
    label: 'ACCOUNTABILITY',
    title: 'Policing the Police',
    description: '$2.14B budget, $384M in settlements, and overtime as an off-books budget expansion.',
    color: '#1E3A5F',
    textColor: '#FFFFFF',
  },
]

export function FeaturedCards() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px' }}>
      {/* 3-col featured */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 48,
        }}
      >
        {FEATURED.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            style={{
              background: card.color,
              border: '3px solid #1A1A1A',
              padding: '32px 28px',
              cursor: 'pointer',
              position: 'relative',
              minHeight: 220,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '2px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 16,
              }}
            >
              {card.label}
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 28,
                fontWeight: 800,
                color: card.textColor,
                lineHeight: 1.2,
                margin: '0 0 12px',
              }}
            >
              {card.title}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.5,
                margin: '0 0 auto',
              }}
            >
              {card.description}
            </p>
            <div
              style={{
                marginTop: 24,
                width: 40,
                height: 40,
                borderRadius: 20,
                border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 18,
              }}
            >
              &rarr;
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trending questions horizontal scroll */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>&#x2197;</span> Trending
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 8,
            scrollbarWidth: 'thin',
          }}
        >
          {TRENDING_QUESTIONS.map((q, i) => (
            <motion.div
              key={q}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{
                flexShrink: 0,
                background: '#F5F5F0',
                border: '2px solid #E5E5E0',
                padding: '16px 20px',
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: '#1A1A1A',
                cursor: 'pointer',
                maxWidth: 280,
                lineHeight: 1.3,
                transition: 'border-color 0.2s',
              }}
              whileHover={{ borderColor: '#E84855' } as any}
            >
              {q}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
