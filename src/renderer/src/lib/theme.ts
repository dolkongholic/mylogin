import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
const KEY = 'mylogin-theme'

export function getInitialTheme(): Theme {
  const saved = localStorage.getItem(KEY)
  return saved === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

// main.tsx에서 첫 렌더 전에 호출 (깜빡임 방지)
export function initTheme(): void {
  applyTheme(getInitialTheme())
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(getInitialTheme())
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(KEY, theme)
  }, [theme])
  const toggle = (): void => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return [theme, toggle]
}
