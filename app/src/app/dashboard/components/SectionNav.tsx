'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SECTIONS } from '../data/sections'

export function SectionNav() {
  const [activeSection, setActiveSection] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const scrollContainer = document.querySelector('div[style*="overflow-y: auto"]') as HTMLElement
    if (!scrollContainer) return

    const handleScroll = () => {
      setShowBackToTop(scrollContainer.scrollTop > 600)

      // Find which section is in view
      const sectionEls = SECTIONS.map(s => document.getElementById(`section-${s.id}`))
      for (let i = sectionEls.length - 1; i >= 0; i--) {
        const el = sectionEls[i]
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 200) {
            setActiveSection(SECTIONS[i].id)
            break
          }
        }
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`)
    const container = document.querySelector('div[style*="overflow-y: auto"]') as HTMLElement
    if (el && container) {
      const top = el.offsetTop - 60
      container.scrollTo({ top, behavior: 'smooth' })
    }
    setNavOpen(false)
  }, [])

  const scrollToTop = useCallback(() => {
    const container = document.querySelector('div[style*="overflow-y: auto"]') as HTMLElement
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <>
      {/* Sticky top nav bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(250,250,250,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E5E5',
        padding: '0 32px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          height: 48, gap: 8,
        }}>
          {/* Logo */}
          <button
            onClick={scrollToTop}
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 16, fontWeight: 800,
              color: '#1A1A1A', background: 'none', border: 'none',
              cursor: 'pointer', marginRight: 16,
            }}
          >
            askLA
          </button>

          {/* Section pills — desktop */}
          <div style={{
            display: 'flex', gap: 4, overflowX: 'auto',
            scrollbarWidth: 'none', flex: 1,
          }}>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.5px',
                  color: activeSection === s.id ? '#FFFFFF' : '#6B7280',
                  background: activeSection === s.id ? s.saturated : 'transparent',
                  border: activeSection === s.id ? 'none' : '1px solid transparent',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Back to top button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            style={{
              position: 'fixed', bottom: 32, right: 32,
              zIndex: 100,
              width: 48, height: 48,
              background: '#1A1A1A', color: '#FFFFFF',
              border: 'none', borderRadius: 24,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            &uarr;
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
