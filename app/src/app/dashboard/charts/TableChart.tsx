'use client'

import { motion } from 'framer-motion'

interface TableRow {
  [key: string]: string | number
}

interface TableChartProps {
  columns: { key: string; label: string; align?: 'left' | 'right' }[]
  rows: TableRow[]
  source?: string
  title?: string
  highlightColumn?: string
}

export function TableChart({ columns, rows, source, title, highlightColumn }: TableChartProps) {
  return (
    <div style={{ background: '#F5F5F0', padding: 24 }}>
      {title && (
        <div style={{
          fontFamily: 'var(--font-body), sans-serif', fontSize: 15, fontWeight: 600,
          color: '#1A1A1A', marginBottom: 16,
        }}>
          {title}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body), sans-serif', fontSize: 13 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{
                  textAlign: col.align || 'left',
                  padding: '10px 12px',
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: '1.5px', textTransform: 'uppercase' as const,
                  color: '#9CA3AF',
                  borderBottom: '2px solid #1A1A1A',
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{
                    padding: '10px 12px',
                    textAlign: col.align || 'left',
                    borderBottom: '1px solid #E5E5E0',
                    fontWeight: col.key === highlightColumn ? 700 : 400,
                    fontFamily: col.align === 'right' ? 'var(--font-mono), monospace' : 'inherit',
                    color: '#1A1A1A',
                  }}>
                    {row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {source && (
        <div style={{ marginTop: 12, fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: '#9CA3AF' }}>
          Source: {source} &rarr;
        </div>
      )}
    </div>
  )
}
