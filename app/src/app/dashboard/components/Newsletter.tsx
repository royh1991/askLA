'use client'

import { motion } from 'framer-motion'

export function Newsletter() {
  return (
    <div style={{ background: '#FFFFFF', padding: '80px 0', borderTop: '1px solid #E5E5E5' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ fontSize: 48, marginBottom: 24 }}>&#x2709;</div>
          <h2
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 36,
              fontWeight: 800,
              color: '#1A1A1A',
              lineHeight: 1.2,
              margin: '0 0 16px',
            }}
          >
            LA&rsquo;s government is complex. Our data doesn&rsquo;t have to be.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 18,
              color: '#6B7280',
              margin: '0 0 32px',
            }}
          >
            Subscribe for weekly data-backed answers about your city.
          </p>
          <div
            style={{
              display: 'flex',
              maxWidth: 480,
              margin: '0 auto',
              border: '3px solid #1A1A1A',
              overflow: 'hidden',
            }}
          >
            <input
              type="email"
              placeholder="Email"
              style={{
                flex: 1,
                padding: '14px 20px',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 16,
                border: 'none',
                outline: 'none',
                background: '#FFFFFF',
              }}
            />
            <button
              style={{
                padding: '14px 28px',
                background: '#E84855',
                color: '#FFFFFF',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 16,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              &rarr;
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
