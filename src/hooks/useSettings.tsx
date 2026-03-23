import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type Settings, defaultSettings } from '../types'

interface Ctx {
  s: Settings
  set: (patch: Partial<Settings>) => void
}

const C = createContext<Ctx | null>(null)

const themeVars: Record<string, Record<string, string>> = {
  default: { '--a': '#c9943a', '--ad': '#7a5818', '--ag': 'rgba(201,148,58,0.12)', '--ab': '#e6b050' },
  warm:    { '--a': '#c07838', '--ad': '#7a4818', '--ag': 'rgba(192,120,56,0.12)', '--ab': '#e09050' },
  cool:    { '--a': '#4a7c9b', '--ad': '#2a4c6b', '--ag': 'rgba(74,124,155,0.12)', '--ab': '#5a9cbb' },
  rose:    { '--a': '#b05070', '--ad': '#702040', '--ag': 'rgba(176,80,112,0.12)', '--ab': '#d06888' },
  violet:  { '--a': '#7060c0', '--ad': '#403090', '--ag': 'rgba(112,96,192,0.12)', '--ab': '#9080e0' },
}

const fontVars: Record<string, string> = {
  sans:  '"DM Sans", system-ui, sans-serif',
  serif: '"Crimson Pro", Georgia, serif',
  mono:  '"JetBrains Mono", monospace',
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem('sv-settings')
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
    } catch {
      return defaultSettings
    }
  })

  useEffect(() => {
    const root = document.documentElement
    const vars = themeVars[s.theme] || themeVars.default
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  }, [s.theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--font', fontVars[s.font] || fontVars.sans)
  }, [s.font])

  const set = (patch: Partial<Settings>) => {
    setS(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem('sv-settings', JSON.stringify(next))
      return next
    })
  }

  return <C.Provider value={{ s, set }}>{children}</C.Provider>
}

export const useSettings = () => {
  const ctx = useContext(C)
  if (!ctx) throw new Error('useSettings outside provider')
  return ctx
}
