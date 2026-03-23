import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Toaster } from 'react-hot-toast'
import { pb } from './lib/pb'
import { SettingsProvider } from './hooks/useSettings'
import { AuthPage } from './components/auth/AuthPage'
import { Sidebar } from './components/layout/Sidebar'
import { NotesSection } from './components/notes/NotesSection'
import { TimerSection } from './components/timer/TimerSection'
import { GoalsSection } from './components/goals/GoalsSection'
import { FlashcardsSection } from './components/flashcards/FlashcardsSection'
import { SettingsSection } from './components/settings/SettingsSection'
import type { Section } from './types'

const toastStyle = {
  style: {
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)',
    fontFamily: 'var(--font)',
    fontSize: '0.85rem',
  },
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(
    pb.authStore.isValid ? (pb.authStore.model?.id ?? null) : null
  )
  const [section, setSection] = useState<Section>('notes')
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => {
      setUserId(pb.authStore.isValid ? (pb.authStore.model?.id ?? null) : null)
    })
    unsubRef.current = unsub
    return () => {
      unsubRef.current?.()
      unsubRef.current = null
    }
  }, [])

  if (!userId) {
    return (
      <SettingsProvider>
        <AuthPage />
        <Toaster position="bottom-right" toastOptions={toastStyle} />
      </SettingsProvider>
    )
  }

  return (
    <SettingsProvider>
      <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', overflow: 'hidden' }}>
        <Sidebar active={section} onChange={setSection} />

        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ height: '100%' }}
            >
              {section === 'notes'      && <NotesSection userId={userId} />}
              {section === 'timer'      && <TimerSection userId={userId} />}
              {section === 'goals'      && <GoalsSection userId={userId} />}
              {section === 'flashcards' && <FlashcardsSection userId={userId} />}
              {section === 'settings'   && <SettingsSection />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster position="bottom-right" toastOptions={toastStyle} />
    </SettingsProvider>
  )
}
