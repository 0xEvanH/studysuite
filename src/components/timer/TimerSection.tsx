import { useState, useEffect, useRef, useCallback, type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee, Brain, List, X } from 'lucide-react'
import { pb } from '../../lib/pb'
import toast from 'react-hot-toast'
import type { TimerLog } from '../../types'
import { useSettings } from '../../hooks/useSettings'
import { useReveal } from '../../hooks/useReveal'
import { Divider } from '../Divider'
import { W, WD, WDD, WDDD } from '../../constants'

type TimerMode = 'pomodoro' | 'short' | 'long'

const MODE_LABELS: Record<TimerMode, string> = { pomodoro: 'Focus', short: 'Short break', long: 'Long break' }

export const TimerSection: FC<{ userId: string }> = ({ userId }) => {
  const { s } = useSettings()
  const [ref, visible] = useReveal()
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [subject, setSubject] = useState('')
  const [logs, setLogs] = useState<TimerLog[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)

  const total = { pomodoro: s.pomodoroMins * 60, short: s.shortBreakMins * 60, long: s.longBreakMins * 60 }[mode]
  const remaining = Math.max(total - elapsed, 0)
  const progress = elapsed / total

  useEffect(() => { fetchLogs() }, [userId])

  useEffect(() => {
    if (remaining === 0 && running) {
      clearInterval(intervalRef.current!)
      setRunning(false)
      saveLog()
      if (s.timerSound) playDone()
      toast.success(`${MODE_LABELS[mode]} complete!`)
    }
  }, [remaining, running])

  const fetchLogs = async () => {
    try {
      const records = await pb.collection('timer_logs').getList<TimerLog>(1, 25, {
        filter: `user = "${userId}"`,
        sort: '-created',
      })
      setLogs(records.items)
    } catch {}
  }

  const saveLog = async () => {
    if (elapsed < 60) return
    try {
      await pb.collection('timer_logs').create({
        user: userId,
        subject: subject || 'General study',
        duration: elapsed,
        mode,
      })
      fetchLogs()
    } catch {}
  }

  const playDone = () => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(); osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  const start = () => {
    startRef.current = Date.now() - elapsed * 1000
    intervalRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 250)
    setRunning(true)
  }

  const pause = () => { clearInterval(intervalRef.current!); setRunning(false) }

  const reset = useCallback(() => { clearInterval(intervalRef.current!); setRunning(false); setElapsed(0) }, [])

  const switchMode = (m: TimerMode) => { reset(); setMode(m) }

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const R = 90
  const circ = 2 * Math.PI * R
  const dash = circ * (1 - progress)

  const todaySecs = logs
    .filter(l => new Date(l.created).toDateString() === new Date().toDateString())
    .reduce((a, l) => a + l.duration, 0)

  return (
    <section ref={ref as React.RefObject<HTMLElement>} style={{ padding: '2.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 'clamp(1.6rem,3vw,2.2rem)', letterSpacing: '-0.03em', color: W, margin: 0, lineHeight: 1 }}>Study Timer</h2>
          <p style={{ color: WD, fontSize: '0.82rem', fontFamily: 'var(--font)', marginTop: '0.4rem' }}>
            {todaySecs > 0 ? `${Math.round(todaySecs / 60)} minutes today` : 'Start a session'}
          </p>
        </div>
        <button onClick={() => setShowLogs(!showLogs)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: 'none', border: 'none', borderRadius: 4, color: showLogs ? 'var(--a)' : WD, cursor: 'pointer' }}>
          <List className="w-4 h-4" />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '3rem', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${WDD}`, opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.1s' }}>
            {(['pomodoro', 'short', 'long'] as TimerMode[]).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.9rem 0.75rem', background: 'none', border: 'none', borderBottom: `2px solid ${mode === m ? 'var(--a)' : 'transparent'}`, marginBottom: '-1px', color: mode === m ? 'var(--a)' : WD, fontFamily: 'var(--font)', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s' }}>
                {m === 'pomodoro' ? <Brain className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'scale(0.95)', transition: 'opacity 0.6s ease 0.15s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s' }}>
            <svg width={220} height={220} viewBox="0 0 220 220">
              <circle cx={110} cy={110} r={R} fill="none" stroke={WDDD} strokeWidth={3} />
              <circle cx={110} cy={110} r={R} fill="none" stroke="var(--a)" strokeWidth={3} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={dash}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '110px 110px', transition: running ? 'stroke-dashoffset 0.25s linear' : 'none' }}
              />
              <text x={110} y={100} textAnchor="middle" style={{ fontFamily: 'var(--font)', fontSize: '2.8rem', fontWeight: 700, fill: W, letterSpacing: '-0.04em' }}>{mins}:{secs}</text>
              <text x={110} y={128} textAnchor="middle" style={{ fontFamily: 'var(--font)', fontSize: '0.72rem', fill: WD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{MODE_LABELS[mode]}</text>
            </svg>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}>
            <button onClick={reset} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: 'none', border: 'none', borderRadius: 4, color: WD, cursor: 'pointer' }}>
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={running ? pause : start}
              style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--a)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a', transition: 'transform 0.15s, box-shadow 0.2s', boxShadow: running ? '0 0 20px var(--ag)' : 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}
            >
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" style={{ marginLeft: 2 }} />}
            </button>
          </div>

          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What are you studying?"
            style={{ background: 'none', border: 'none', borderBottom: `1px solid ${WDD}`, color: W, fontFamily: 'var(--font)', fontSize: '0.88rem', padding: '0.4rem 0', outline: 'none', textAlign: 'center', width: 260, opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.25s' }}
            onFocus={e => (e.target.style.borderBottomColor = 'var(--a)')}
            onBlur={e => (e.target.style.borderBottomColor = WDD)}
          />
        </div>

        <AnimatePresence>
          {showLogs && (
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}
              style={{ width: 280, borderLeft: `1px solid ${WDD}`, paddingLeft: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.85rem', color: W, letterSpacing: '-0.01em' }}>Session log</span>
                <button onClick={() => setShowLogs(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WD }}><X className="w-3.5 h-3.5" /></button>
              </div>
              {logs.length === 0 ? (
                <p style={{ fontFamily: 'var(--font)', fontSize: '0.78rem', color: WD, margin: 0 }}>No sessions yet</p>
              ) : logs.map(log => <LogRow key={log.id} log={log} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

const LogRow: FC<{ log: TimerLog }> = ({ log }) => {
  const [h, setH] = useState(false)
  const mins = Math.round(log.duration / 60)
  return (
    <div>
      <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ padding: '0.65rem 0', cursor: 'default' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: '0.82rem', color: h ? W : 'rgba(255,255,255,0.8)', transition: 'color 0.2s, transform 0.3s', transform: h ? 'translateX(3px)' : 'none' }}>{log.subject}</span>
          <span style={{ fontFamily: 'var(--font)', fontSize: '0.72rem', color: 'var(--a)', fontWeight: 600 }}>{mins}m</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: WD }}>{log.mode}</span>
          <span style={{ fontFamily: 'var(--font)', fontSize: '0.68rem', color: WDD }}>{new Date(log.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
      <Divider />
    </div>
  )
}
