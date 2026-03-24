import type { FC } from 'react'
import { StickyNote, Timer, Target, Layers, Settings } from 'lucide-react'
import type { Section } from '../../types'
import { WD, WDD } from '../../constants'

const ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'notes',      label: 'Notes',  icon: <StickyNote className="w-5 h-5" /> },
  { id: 'timer',      label: 'Timer',  icon: <Timer className="w-5 h-5" /> },
  { id: 'goals',      label: 'Goals',  icon: <Target className="w-5 h-5" /> },
  { id: 'flashcards', label: 'Cards',  icon: <Layers className="w-5 h-5" /> },
  { id: 'settings',   label: 'More',   icon: <Settings className="w-5 h-5" /> },
]

interface Props {
  active: Section
  onChange: (s: Section) => void
}

export const BottomNav: FC<Props> = ({ active, onChange }) => (
  <nav className="bottom-nav-root" style={{ borderTop: `1px solid ${WDD}` }}>
    {ITEMS.map(item => {
      const on = active === item.id
      return (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.2rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: on ? 'var(--a)' : WD,
            transition: 'color 0.2s',
            position: 'relative',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {on && (
            <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: 'var(--a)', borderRadius: '0 0 2px 2px' }} />
          )}
          {item.icon}
          <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font)', letterSpacing: '0.04em', fontWeight: on ? 600 : 400 }}>
            {item.label}
          </span>
        </button>
      )
    })}
  </nav>
)
