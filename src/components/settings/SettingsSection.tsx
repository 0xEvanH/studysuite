import { type FC } from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '../../hooks/useSettings'
import type { Theme, FontStyle, NoteLayout, CardStyle } from '../../types'
import { useReveal } from '../../hooks/useReveal'
import { Divider } from '../Divider'
import { W, WD, WDD } from '../../constants'

const themes: { id: Theme; label: string; color: string }[] = [
  { id: 'default', label: 'Amber', color: '#c9943a' },
  { id: 'warm',    label: 'Warm',  color: '#c07838' },
  { id: 'cool',    label: 'Teal',  color: '#4a7c9b' },
  { id: 'rose',    label: 'Rose',  color: '#b05070' },
  { id: 'violet',  label: 'Violet', color: '#7060c0' },
]

const fonts: { id: FontStyle; label: string; preview: string }[] = [
  { id: 'sans',  label: 'Sans-serif', preview: 'Aa' },
  { id: 'serif', label: 'Serif',      preview: 'Aa' },
  { id: 'mono',  label: 'Mono',       preview: 'Aa' },
]

const layouts: { id: NoteLayout; label: string; desc: string }[] = [
  { id: 'grid',  label: 'Grid',  desc: '3-column card grid' },
  { id: 'dense', label: 'Dense', desc: '4-column compact grid' },
  { id: 'list',  label: 'List',  desc: 'Single-column rows' },
]

const cardStyles: { id: CardStyle; label: string; desc: string }[] = [
  { id: 'minimal',  label: 'Minimal',  desc: 'Border appears on hover only' },
  { id: 'bordered', label: 'Bordered', desc: 'Persistent subtle border' },
  { id: 'filled',   label: 'Filled',   desc: 'Subtle background fill' },
]

export const SettingsSection: FC = () => {
  const { s, set } = useSettings()
  const [ref, visible] = useReveal()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={{ padding: '2.5rem', height: '100%', overflowY: 'auto' }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(12px)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
          marginBottom: '2.5rem',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 'clamp(1.6rem,3vw,2.2rem)', letterSpacing: '-0.03em', color: W, margin: 0, lineHeight: 1 }}>
          Settings
        </h2>
        <p style={{ color: WD, fontSize: '0.82rem', fontFamily: 'var(--font)', marginTop: '0.4rem' }}>
          Personalise your vault
        </p>
      </div>

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        <Group label="Accent colour" delay={0.05} visible={visible}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => set({ theme: t.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 4,
                  background: s.theme === t.id ? t.color + '18' : 'transparent',
                  border: `1px solid ${s.theme === t.id ? t.color + '88' : WDD}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font)', fontSize: '0.82rem', color: s.theme === t.id ? W : WD }}>{t.label}</span>
              </button>
            ))}
          </div>
        </Group>

        <Group label="Font style" delay={0.1} visible={visible}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {fonts.map(f => {
              const fontMap = { sans: '"DM Sans", system-ui, sans-serif', serif: '"Crimson Pro", Georgia, serif', mono: '"JetBrains Mono", monospace' }
              return (
                <button
                  key={f.id}
                  onClick={() => set({ font: f.id })}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: 4,
                    background: s.font === f.id ? 'var(--ag)' : 'transparent',
                    border: `1px solid ${s.font === f.id ? 'var(--ad)' : WDD}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span style={{ fontFamily: fontMap[f.id], fontSize: '1.2rem', fontWeight: 600, color: s.font === f.id ? 'var(--a)' : WD }}>
                    {f.preview}
                  </span>
                  <span style={{ fontFamily: 'var(--font)', fontSize: '0.7rem', color: s.font === f.id ? W : WDD, letterSpacing: '0.06em' }}>
                    {f.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Group>

        <Group label="Note layout" delay={0.15} visible={visible}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {layouts.map((l, i) => (
              <div key={l.id}>
                <OptionRow
                  label={l.label}
                  desc={l.desc}
                  active={s.noteLayout === l.id}
                  onClick={() => set({ noteLayout: l.id })}
                />
                {i < layouts.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Group>

        <Group label="Card style" delay={0.2} visible={visible}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {cardStyles.map((cs, i) => (
              <div key={cs.id}>
                <OptionRow
                  label={cs.label}
                  desc={cs.desc}
                  active={s.cardStyle === cs.id}
                  onClick={() => set({ cardStyle: cs.id })}
                />
                {i < cardStyles.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Group>

        <Group label="Sidebar" delay={0.25} visible={visible}>
          <ToggleRow label="Show sidebar labels" active={s.sidebarLabels} onChange={v => set({ sidebarLabels: v })} />
        </Group>

        <Group label="Timer" delay={0.3} visible={visible}>
          <ToggleRow label="Sound on session end" active={s.timerSound} onChange={v => set({ timerSound: v })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <NumInput label="Focus" value={s.pomodoroMins} min={1} max={90} onChange={v => set({ pomodoroMins: v })} />
            <NumInput label="Short break" value={s.shortBreakMins} min={1} max={30} onChange={v => set({ shortBreakMins: v })} />
            <NumInput label="Long break" value={s.longBreakMins} min={5} max={60} onChange={v => set({ longBreakMins: v })} />
          </div>
        </Group>

      </div>
    </section>
  )
}

const Group: FC<{ label: string; delay: number; visible: boolean; children: React.ReactNode }> = ({ label, delay, visible, children }) => (
  <motion.div
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(10px)',
      transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--font)',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: WD,
        marginBottom: '1rem',
      }}
    >
      {label}
    </div>
    {children}
  </motion.div>
)

const OptionRow: FC<{ label: string; desc: string; active: boolean; onClick: () => void }> = ({ label, desc, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div>
        <span style={{ fontFamily: 'var(--font)', fontSize: '0.88rem', color: active ? W : WD, fontWeight: active ? 600 : 400, transition: 'color 0.2s' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font)', fontSize: '0.75rem', color: WDD, display: 'block', marginTop: '0.1rem' }}>
          {desc}
        </span>
      </div>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `2px solid ${active ? 'var(--a)' : WDD}`,
          background: active ? 'var(--a)' : 'transparent',
          flexShrink: 0,
          transition: 'all 0.2s',
        }}
      />
    </button>
  )
}

const ToggleRow: FC<{ label: string; active: boolean; onChange: (v: boolean) => void }> = ({ label, active, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
    <span style={{ fontFamily: 'var(--font)', fontSize: '0.88rem', color: WD }}>{label}</span>
    <button
      onClick={() => onChange(!active)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: active ? 'var(--a)' : WDD,
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.25s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: active ? 'calc(100% - 21px)' : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      />
    </button>
  </div>
)

const NumInput: FC<{ label: string; value: number; min: number; max: number; onChange: (v: number) => void }> = ({ label, value, min, max, onChange }) => (
  <div>
    <label style={{ display: 'block', fontFamily: 'var(--font)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: WD, marginBottom: '0.4rem' }}>
      {label}
    </label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${WDD}`, color: W, fontFamily: 'var(--font)', fontSize: '1rem', fontWeight: 600, padding: '0.3rem 0', outline: 'none', textAlign: 'center' }}
        onFocus={e => (e.target.style.borderBottomColor = 'var(--a)')}
        onBlur={e => (e.target.style.borderBottomColor = WDD)}
      />
      <span style={{ fontFamily: 'var(--font)', fontSize: '0.72rem', color: WDD }}>min</span>
    </div>
  </div>
)
