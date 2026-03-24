import { useState } from 'react'
import type { FC } from 'react'
import { StickyNote, Timer, Target, Layers, Settings, LogOut } from 'lucide-react'
import type { Section } from '../../types'
import { useSettings } from '../../hooks/useSettings'
import { pb } from '../../lib/pb'
import { Logo } from '../Logo'
import toast from 'react-hot-toast'
import { WD, WDD } from '../../constants'

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'notes',      label: 'Notes',      icon: <StickyNote className="w-4 h-4" /> },
  { id: 'timer',      label: 'Timer',      icon: <Timer className="w-4 h-4" /> },
  { id: 'goals',      label: 'Goals',      icon: <Target className="w-4 h-4" /> },
  { id: 'flashcards', label: 'Flashcards', icon: <Layers className="w-4 h-4" /> },
]

interface Props {
  active: Section
  onChange: (s: Section) => void
}

export const Sidebar: FC<Props> = ({ active, onChange }) => {
  const { s } = useSettings()
  const [collapsed, setCollapsed] = useState(false)
  const showLabel = !collapsed && s.sidebarLabels
  const w = showLabel ? 200 : 56

  const logout = () => {
    pb.authStore.clear()
    toast.success('Signed out')
  }

  return (
    <aside
      className="sidebar-root"
      style={{
        width: w,
        minWidth: w,
        borderRight: `1px solid ${WDD}`,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* Logo row — clicking collapses sidebar */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 0.85rem',
          borderBottom: `1px solid ${WDD}`,
          gap: '0.6rem',
          cursor: 'pointer',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        <Logo size={22} style={{ flexShrink: 0 }} />
        {showLabel && (
          <span style={{
            fontFamily: 'var(--font)',
            fontWeight: 700,
            fontSize: '0.9rem',
            letterSpacing: '-0.02em',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}>
            StudyVault
          </span>
        )}
      </div>

      <nav style={{ flex: 1, padding: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => (
          <NavRow
            key={item.id}
            item={item}
            isActive={active === item.id}
            showLabel={showLabel}
            onClick={() => onChange(item.id)}
          />
        ))}
      </nav>

      <div style={{ padding: '0.5rem 0 1rem', borderTop: `1px solid ${WDD}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavRow
          item={{ id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }}
          isActive={active === 'settings'}
          showLabel={showLabel}
          onClick={() => onChange('settings')}
        />
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.5rem 1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: WD,
            width: '100%',
            fontFamily: 'var(--font)',
            fontSize: '0.82rem',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = WD)}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {showLabel && <span style={{ whiteSpace: 'nowrap' }}>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}

interface RowProps {
  item: { id: string; label: string; icon: React.ReactNode }
  isActive: boolean
  showLabel: boolean
  onClick: () => void
}

const NavRow: FC<RowProps> = ({ item, isActive, showLabel, onClick }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.5rem 1rem',
        background: isActive ? 'var(--ag)' : hovered ? 'rgba(255,255,255,0.04)' : 'none',
        border: 'none',
        borderLeft: `2px solid ${isActive ? 'var(--a)' : 'transparent'}`,
        cursor: 'pointer',
        color: isActive ? 'var(--a)' : hovered ? '#fff' : WD,
        width: '100%',
        fontFamily: 'var(--font)',
        fontSize: '0.82rem',
        transition: 'all 0.2s ease',
        textAlign: 'left',
      }}
    >
      <span style={{ flexShrink: 0 }}>{item.icon}</span>
      {showLabel && (
        <span style={{
          whiteSpace: 'nowrap',
          transform: hovered ? 'translateX(3px)' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {item.label}
        </span>
      )}
    </button>
  )
}
