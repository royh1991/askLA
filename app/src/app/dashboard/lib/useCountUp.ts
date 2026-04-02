'use client'

import { useEffect, useState, useRef } from 'react'
import { useInView } from 'framer-motion'

export function useCountUp(end: number, duration = 1200) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    let start: number | null = null
    let raf: number

    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 4) // easeOutQuart
      setVal(Math.round(eased * end))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, end, duration])

  return { val, ref }
}

export function formatCountUp(val: number, format: string): string {
  if (format === '$B') return `$${(val / 1e9).toFixed(1)}B`
  if (format === '$M') return `$${(val / 1e6).toFixed(1)}M`
  if (format === '$K') return `$${(val / 1e3).toFixed(0)}K`
  if (format === 'K') return `${(val / 1e3).toFixed(0)}K`
  if (format === 'M') return `${(val / 1e6).toFixed(1)}M`
  if (format === '%') return `${val}%`
  return val.toLocaleString()
}
