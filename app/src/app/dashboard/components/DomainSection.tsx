'use client'

import { motion } from 'framer-motion'
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
  const isEven = index % 2 === 0

  return (
    <div>
      {/* Section hero band */}
      <div
        style={{
          background: isEven ? section.saturated : section.pastel,
          padding: '64px 0',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 32px',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 48,
            alignItems: 'center',
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
                fontSize: 64,
                fontWeight: 800,
                color: isEven ? '#E84855' : section.saturated,
                lineHeight: 1,
                margin: '0 0 24px',
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
                fontSize: 18,
                color: isEven ? section.textOnSaturated : '#1A1A1A',
                lineHeight: 1.6,
                maxWidth: 600,
                margin: 0,
                opacity: 0.9,
              }}
            >
              {section.description}
            </motion.p>
          </div>
          {/* Placeholder for Gemini-generated isometric illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              width: 200,
              height: 200,
              background: isEven ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono), monospace',
              fontSize: 11,
              color: isEven ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
              textAlign: 'center',
              justifySelf: 'end',
              padding: 16,
              border: `3px solid ${isEven ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            {section.iconSubject}
          </motion.div>
        </div>
      </div>

      {/* Question cards grid */}
      <div
        style={{
          background: isEven ? '#FFFFFF' : section.pastel,
          padding: '48px 0 64px',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 32px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase' as const,
              color: '#9CA3AF',
              marginBottom: 24,
            }}
          >
            {questions.length} QUESTIONS
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                accentColor={section.saturated}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Signature visualization */}
        <SignatureViz sectionId={section.id} color={section.saturated} />
      </div>
    </div>
  )
}
