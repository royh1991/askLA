import type { Metadata } from 'next'
import { Rethink_Sans, DM_Sans, Azeret_Mono } from 'next/font/google'

const rethinkSans = Rethink_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const azeretMono = Azeret_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'askLA — Civic Intelligence Platform',
  description: 'Answers straight from the source. 24 tables. 2.19M rows. The data LA deserves.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${rethinkSans.variable} ${dmSans.variable} ${azeretMono.variable}`}
      style={{
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#FAFAFA',
        color: '#1A1A1A',
        fontFamily: 'var(--font-body), system-ui, sans-serif',
        fontSize: 16,
      }}
    >
      {children}
    </div>
  )
}
