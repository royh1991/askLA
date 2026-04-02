'use client'

import { Hero } from './components/Hero'
import { Ticker } from './components/Ticker'
import { FeaturedCards } from './components/FeaturedCards'
import { DomainSection } from './components/DomainSection'
import { Newsletter } from './components/Newsletter'
import { SECTIONS } from './data/sections'
import { getQuestionsBySection } from './data/questions'

export default function DashboardPage() {
  return (
    <>
      {/* 1. Hero */}
      <Hero />

      {/* 2. Pretext-powered ticker */}
      <Ticker />

      {/* 3. Featured cards + trending */}
      <FeaturedCards />

      {/* 4. Domain sections (10 sections, alternating colors) */}
      {SECTIONS.map((section, i) => (
        <DomainSection
          key={section.id}
          section={section}
          questions={getQuestionsBySection(section.id)}
          index={i}
        />
      ))}

      {/* 5. Newsletter CTA */}
      <Newsletter />

      {/* 6. Footer */}
      <footer
        style={{
          background: '#1A1A1A',
          padding: '48px 0',
          textAlign: 'center',
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
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 20,
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: 12,
            }}
          >
            askLA
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: 11,
              color: '#6B7280',
              letterSpacing: '1px',
              margin: '0 0 24px',
            }}
          >
            Built on 24 Postgres tables &middot; 2.19M rows &middot; 30+ public data sources
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 32,
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 13,
              color: '#9CA3AF',
            }}
          >
            <span>Data Sources</span>
            <span>Methodology</span>
            <span>GitHub</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </>
  )
}
