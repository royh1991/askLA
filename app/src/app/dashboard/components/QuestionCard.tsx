'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Question } from '../data/questions'
import { useTextLayout } from '../lib/pretext'
import { AnswerView } from './AnswerView'

interface QuestionCardProps {
  question: Question
  accentColor: string
  index: number
}

export function QuestionCard({ question, accentColor, index }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Use pretext to predict text height and adjust card padding
  const { height: textHeight } = useTextLayout(
    question.question,
    '700 20px "Rethink Sans", sans-serif',
    280,
    26
  )
  const needsExtraPadding = textHeight > 60

  return (
    <div style={{ gridColumn: expanded ? '1 / -1' : undefined }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        whileHover={expanded ? undefined : { y: -3, transition: { duration: 0.2 } }}
        onClick={() => setExpanded(!expanded)}
        style={{
          background: '#FFFFFF',
          border: `3px solid ${expanded ? accentColor : '#1A1A1A'}`,
          padding: needsExtraPadding ? '28px 28px 32px' : '24px 24px 28px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!expanded) (e.currentTarget as HTMLDivElement).style.borderColor = accentColor
        }}
        onMouseLeave={(e) => {
          if (!expanded) (e.currentTarget as HTMLDivElement).style.borderColor = '#1A1A1A'
        }}
      >
        {/* Accent bar top */}
        <div style={{
          position: 'absolute', top: -3, left: -3, right: -3, height: 4,
          background: accentColor,
        }} />

        {/* Hero number */}
        {question.heroNumber && (
          <div style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: expanded ? 48 : 36, fontWeight: 700,
            color: '#1A1A1A', lineHeight: 1, marginBottom: 8,
            transition: 'font-size 0.3s',
          }}>
            {question.heroNumber}
          </div>
        )}

        {/* Question */}
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: expanded ? 24 : 20, fontWeight: 700,
          color: '#1A1A1A', lineHeight: 1.3, margin: '0 0 12px',
          transition: 'font-size 0.3s',
        }}>
          {question.question}
        </h3>

        {/* Hero label */}
        {question.heroLabel && (
          <p style={{
            fontFamily: 'var(--font-body), sans-serif',
            fontSize: 14, color: '#6B7280', margin: '0 0 12px',
          }}>
            {question.heroLabel}
          </p>
        )}

        {/* Source + arrow */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 12, borderTop: '1px solid #F0F0F0',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 10, fontWeight: 500, color: '#9CA3AF',
            letterSpacing: '1px', textTransform: 'uppercase' as const,
          }}>
            {question.dataSource.split('+')[0].trim().replace(/[`()]/g, '')}
          </span>
          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: 16, color: accentColor }}
          >
            &rarr;
          </motion.span>
        </div>
      </motion.div>

      {/* Expanded answer view */}
      <AnimatePresence>
        {expanded && (
          <AnswerView
            question={question}
            accentColor={accentColor}
            onClose={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
