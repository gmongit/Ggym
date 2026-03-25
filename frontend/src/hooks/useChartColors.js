import { useState, useEffect } from 'react'

function readColors() {
  const s = getComputedStyle(document.documentElement)
  const g = (v) => s.getPropertyValue(v).trim()
  return {
    accent:      g('--accent'),
    accentBright: g('--accent-bright'),
    border:      g('--border'),
    textMuted:   g('--text-muted'),
    text:        g('--text'),
    modalBg:     g('--modal-bg'),
    modalBorder: g('--modal-border'),
    chipBg:      g('--chip-bg'),
    surface:     g('--surface'),
  }
}

export function useChartColors() {
  const [colors, setColors] = useState(readColors)

  useEffect(() => {
    const handler = () => setColors(readColors())
    window.addEventListener('themechange', handler)
    return () => window.removeEventListener('themechange', handler)
  }, [])

  return colors
}
