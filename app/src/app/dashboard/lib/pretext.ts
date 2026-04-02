'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { prepare, layout, prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

/**
 * Measure single-line text width using pretext (no DOM measurement).
 * Returns pixel width of text rendered in the given font.
 */
export function useTextWidth(text: string, font: string): number {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    try {
      const prepared = prepareWithSegments(text, font)
      const result = layoutWithLines(prepared, 100000, 20)
      setWidth(result.lines[0]?.width ?? 0)
    } catch {
      setWidth(text.length * 7) // fallback
    }
  }, [text, font])
  return width
}

/**
 * Measure text height at a given width using pretext.
 * Returns { height, lineCount } without any DOM measurement.
 */
export function useTextLayout(text: string, font: string, maxWidth: number, lineHeight: number) {
  const [result, setResult] = useState({ height: 0, lineCount: 0 })
  useEffect(() => {
    try {
      const prepared = prepare(text, font)
      const measured = layout(prepared, maxWidth, lineHeight)
      setResult(measured)
    } catch {
      // fallback estimate
      const charsPerLine = Math.floor(maxWidth / 8)
      const lines = Math.ceil(text.length / charsPerLine)
      setResult({ height: lines * lineHeight, lineCount: lines })
    }
  }, [text, font, maxWidth, lineHeight])
  return result
}

/**
 * Measure multiple text segments for ticker/scroll animations.
 * Returns array of { text, width } without DOM measurement.
 */
export function useTickerSegments(texts: string[], font: string, gap: number = 48) {
  const [segments, setSegments] = useState<{ text: string; width: number }[]>([])
  const [totalWidth, setTotalWidth] = useState(0)

  useEffect(() => {
    try {
      const measured = texts.map((text) => {
        const full = text + '  \u00b7  '
        const prepared = prepareWithSegments(full, font)
        const result = layoutWithLines(prepared, 100000, 20)
        return { text: full, width: (result.lines[0]?.width ?? 100) + gap }
      })
      setSegments(measured)
      setTotalWidth(measured.reduce((s, m) => s + m.width, 0))
    } catch {
      const fallback = texts.map((text) => ({
        text: text + '  \u00b7  ',
        width: text.length * 7 + gap,
      }))
      setSegments(fallback)
      setTotalWidth(fallback.reduce((s, m) => s + m.width, 0))
    }
  }, [texts, font, gap])

  return { segments, totalWidth }
}

/**
 * Dynamically reflow text on resize using pretext measurement.
 * Returns current line count and height for responsive layout.
 */
export function useResponsiveText(text: string, font: string, lineHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState({ height: 0, lineCount: 0 })

  const measure = useCallback(() => {
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth
    try {
      const prepared = prepare(text, font)
      const measured = layout(prepared, width, lineHeight)
      setResult(measured)
    } catch {
      // fallback
    }
  }, [text, font, lineHeight])

  useEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [measure])

  return { containerRef, ...result }
}
