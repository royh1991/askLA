'use client'

import { motion } from 'framer-motion'

interface SankeyNode {
  id: string
  label: string
  value: number
  color?: string
}

interface SankeyLink {
  source: string
  target: string
  value: number
}

interface SankeyDiagramProps {
  leftNodes: SankeyNode[]
  rightNodes: SankeyNode[]
  links: SankeyLink[]
  width?: number
  height?: number
  leftColor?: string
  rightColor?: string
  leftLabel?: string
  rightLabel?: string
  centerLabel?: string
  source?: string
  title?: string
  formatValue?: (v: number) => string
}

export function SankeyDiagram({
  leftNodes, rightNodes, links,
  width = 900, height = 600,
  leftColor = '#0984E3', rightColor = '#A855F7',
  leftLabel = 'Revenue', rightLabel = 'Spending',
  centerLabel,
  source, title,
  formatValue = (v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(0)}M` : `$${v}`,
}: SankeyDiagramProps) {
  const pad = { top: 40, bottom: 24 }
  const nodeW = 140
  const centerX = width / 2
  const leftX = 0
  const rightX = width - nodeW
  const usableH = height - pad.top - pad.bottom
  const nodeGap = 4

  // Calculate positions for left nodes
  const leftTotal = leftNodes.reduce((s, n) => s + n.value, 0)
  let leftY = pad.top
  const leftPositions = leftNodes.map((n) => {
    const h = Math.max(20, (n.value / leftTotal) * usableH - nodeGap)
    const pos = { ...n, x: leftX, y: leftY, w: nodeW, h }
    leftY += h + nodeGap
    return pos
  })

  // Calculate positions for right nodes
  const rightTotal = rightNodes.reduce((s, n) => s + n.value, 0)
  let rightY = pad.top
  const rightPositions = rightNodes.map((n) => {
    const h = Math.max(20, (n.value / rightTotal) * usableH - nodeGap)
    const pos = { ...n, x: rightX, y: rightY, w: nodeW, h }
    rightY += h + nodeGap
    return pos
  })

  // Build link paths (cubic bezier curves)
  const linkPaths = links.map((link) => {
    const src = leftPositions.find(n => n.id === link.source)
    const tgt = rightPositions.find(n => n.id === link.target)
    if (!src || !tgt) return null

    const srcMidY = src.y + src.h / 2
    const tgtMidY = tgt.y + tgt.h / 2
    const thickness = Math.max(2, (link.value / Math.max(leftTotal, rightTotal)) * usableH * 0.8)

    const x1 = src.x + src.w
    const x2 = tgt.x
    const cpx = (x1 + x2) / 2

    return {
      ...link,
      path: `M${x1},${srcMidY - thickness / 2} C${cpx},${srcMidY - thickness / 2} ${cpx},${tgtMidY - thickness / 2} ${x2},${tgtMidY - thickness / 2} L${x2},${tgtMidY + thickness / 2} C${cpx},${tgtMidY + thickness / 2} ${cpx},${srcMidY + thickness / 2} ${x1},${srcMidY + thickness / 2} Z`,
      srcColor: src.color || leftColor,
      tgtColor: tgt.color || rightColor,
    }
  }).filter(Boolean)

  return (
    <div style={{ background: '#F5F5F0', padding: 24, overflowX: 'auto' }}>
      {title && (
        <div style={{
          fontFamily: 'var(--font-body), sans-serif', fontSize: 15, fontWeight: 600,
          color: '#1A1A1A', marginBottom: 16,
        }}>
          {title}
        </div>
      )}

      {/* Column labels */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 8,
        fontFamily: 'var(--font-mono), monospace', fontSize: 11, fontWeight: 600,
        letterSpacing: '2px', color: '#9CA3AF', textTransform: 'uppercase' as const,
        maxWidth: width,
      }}>
        <span>{leftLabel}</span>
        {centerLabel && <span>{centerLabel}</span>}
        <span>{rightLabel}</span>
      </div>

      <motion.svg
        width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', maxWidth: '100%' }}
        initial="hidden" whileInView="visible" viewport={{ once: true }}
      >
        {/* Links */}
        {linkPaths.map((link, i) => (
          <motion.path key={i} d={link!.path} fill={link!.srcColor} opacity={0.12}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.12 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.02 }} />
        ))}

        {/* Left nodes */}
        {leftPositions.map((n, i) => (
          <g key={`l-${i}`}>
            <motion.rect x={n.x} y={n.y} width={n.w} height={n.h}
              fill={n.color || leftColor}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              style={{ transformOrigin: 'left' }} />
            {n.h > 24 && (
              <>
                <text x={n.x + 8} y={n.y + 16} fontSize={12} fontWeight={700}
                  fontFamily="var(--font-mono), monospace" fill="rgba(255,255,255,0.95)">
                  {formatValue(n.value)}
                </text>
                {n.h > 36 && (
                  <text x={n.x + 8} y={n.y + 30} fontSize={10}
                    fontFamily="var(--font-body), sans-serif" fill="rgba(255,255,255,0.7)">
                    {n.label.length > 18 ? n.label.slice(0, 18) + '...' : n.label}
                  </text>
                )}
              </>
            )}
          </g>
        ))}

        {/* Right nodes */}
        {rightPositions.map((n, i) => (
          <g key={`r-${i}`}>
            <motion.rect x={n.x} y={n.y} width={n.w} height={n.h}
              fill={n.color || rightColor}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
              style={{ transformOrigin: 'right' }} />
            {n.h > 24 && (
              <>
                <text x={n.x + 8} y={n.y + 16} fontSize={12} fontWeight={700}
                  fontFamily="var(--font-mono), monospace" fill="rgba(255,255,255,0.95)">
                  {formatValue(n.value)}
                </text>
                {n.h > 36 && (
                  <text x={n.x + 8} y={n.y + 30} fontSize={10}
                    fontFamily="var(--font-body), sans-serif" fill="rgba(255,255,255,0.7)">
                    {n.label.length > 18 ? n.label.slice(0, 18) + '...' : n.label}
                  </text>
                )}
              </>
            )}
          </g>
        ))}

        {/* Center spine labels */}
        {centerLabel && (
          <>
            <text x={centerX} y={pad.top + usableH * 0.35} textAnchor="middle"
              fontSize={13} fontWeight={700} fill="#9CA3AF"
              fontFamily="var(--font-mono), monospace"
              style={{ writingMode: 'vertical-rl' } as any}>
              {formatValue(leftTotal)} {leftLabel}
            </text>
            <text x={centerX} y={pad.top + usableH * 0.65} textAnchor="middle"
              fontSize={13} fontWeight={700} fill="#9CA3AF"
              fontFamily="var(--font-mono), monospace"
              style={{ writingMode: 'vertical-rl' } as any}>
              {formatValue(rightTotal)} {rightLabel}
            </text>
          </>
        )}
      </motion.svg>
      {source && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 12,
          fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF',
        }}>
          <span>Source: {source} &rarr;</span>
          <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 11, color: '#D0D0D0' }}>askLA</span>
        </div>
      )}
    </div>
  )
}
