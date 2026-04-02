'use client'

import { useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import type { Section } from '../data/sections'
import type { Question } from '../data/questions'
import { QuestionCard } from './QuestionCard'
import { SignatureViz } from './SignatureViz'

interface DomainSectionProps {
  section: Section
  questions: Question[]
  index: number
}

export function DomainSection({ section, questions, index }: DomainSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const isEven = index % 2 === 0
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start end', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [30, -30])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6])

  // Imagen 4.0 generated illustration (PNG)
  const imageSrc = `/sprites/dashboard/section-${section.id}.png`

  return (
    <div id={`section-${section.id}`}>
      {/* Section hero band with parallax */}
      <motion.div
        ref={heroRef}
        style={{
          background: isEven ? section.saturated : section.pastel,
          padding: '56px 0',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.002 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 32px',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 48,
            alignItems: 'center',
            y: heroY,
            opacity: heroOpacity,
          }}
        >
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 56,
                fontWeight: 800,
                color: isEven ? '#E84855' : section.saturated,
                lineHeight: 1,
                margin: '0 0 20px',
              }}
            >
              {section.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 17,
                color: isEven ? section.textOnSaturated : '#1A1A1A',
                lineHeight: 1.6,
                maxWidth: 560,
                margin: 0,
                opacity: 0.9,
              }}
            >
              {section.description}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: 20,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--font-mono), monospace',
                fontSize: 12, fontWeight: 600,
                color: isEven ? 'rgba(255,255,255,0.7)' : '#6B7280',
                letterSpacing: '1px',
              }}
            >
              {questions.length} QUESTIONS
              <motion.span
                animate={{ rotate: expanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: 16 }}
              >
                &rarr;
              </motion.span>
            </motion.div>
          </div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ justifySelf: 'end' }}
          >
            <img
              src={imageSrc}
              alt={section.title}
              width={240}
              height={240}
              style={{
                objectFit: 'contain',
                filter: isEven ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
                borderRadius: 8,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Collapsible question cards + signature viz */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            style={{ overflow: 'hidden' }}
          >
            {/* Question cards grid */}
            <div style={{ background: isEven ? '#FFFFFF' : section.pastel, padding: '48px 0 40px' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 24,
                }}>
                  {questions.map((q, i) => (
                    <QuestionCard key={q.id} question={q} accentColor={section.saturated} index={i} />
                  ))}
                </div>
              </div>
            </div>

            {/* Signature visualization */}
            <div style={{ background: isEven ? '#FFFFFF' : section.pastel, paddingBottom: 48 }}>
              <SignatureViz sectionId={section.id} color={section.saturated} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
