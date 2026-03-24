import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { pb } from '../../lib/pb'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { Logo } from '../Logo'
import { WD, WDD } from '../../constants'

type Mode = 'in' | 'up'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      if (mode === 'up') {
        await pb.collection('users').create({ email, password, passwordConfirm: password })
        await pb.collection('users').authWithPassword(email, password)
        toast.success('Account created.')
      } else {
        await pb.collection('users').authWithPassword(email, password)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split" style={{ background: '#0a0a0a' }}>
      <div
        className="auth-left"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 40% 50%, var(--ag) 0%, transparent 70%)',
          position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Logo size={48} style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{
            fontFamily: 'var(--font)',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '-0.04em',
            color: '#fff',
            lineHeight: 1,
          }}>
            StudyVault
          </h1>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: WD, fontFamily: 'var(--font)', maxWidth: 280, margin: '0.75rem auto 0' }}>
            Notes, timers, goals and flashcards, all in one place.
          </p>
        </div>
      </div>

      <div className="auth-right" style={{ background: '#0d0d0d' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mobile-logo-header" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <Logo size={24} />
              <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: '#fff' }}>
                StudyVault
              </span>
            </div>
          </div>

          <h2 style={{
            fontFamily: 'var(--font)',
            fontWeight: 700,
            fontSize: '1.4rem',
            letterSpacing: '-0.03em',
            color: '#fff',
            lineHeight: 1,
            marginBottom: '0.4rem',
          }}>
            {mode === 'in' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: WD, fontFamily: 'var(--font)', marginBottom: '2rem' }}>
            {mode === 'in' ? 'Sign in to your vault' : 'Start organising your studies'}
          </p>

          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${WDD}`, marginBottom: '2rem' }}>
            {(['in', 'up'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '0 0 0.65rem',
                  marginRight: '1.5rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font)',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: mode === m ? '#fff' : WD,
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${mode === m ? 'var(--a)' : 'transparent'}`,
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                {m === 'in' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              onSubmit={submit}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@uni.edu"
                    required
                    style={inp}
                    onFocus={e => (e.target.style.borderBottomColor = 'var(--a)')}
                    onBlur={e => (e.target.style.borderBottomColor = WDD)}
                  />
                </Field>

                <Field label="Password">
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      style={{ ...inp, paddingRight: '2rem' }}
                      onFocus={e => (e.target.style.borderBottomColor = 'var(--a)')}
                      onBlur={e => (e.target.style.borderBottomColor = WDD)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: WD, padding: 0 }}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 1.5rem',
                    background: 'var(--a)',
                    color: '#0a0a0a',
                    border: 'none',
                    borderRadius: 4,
                    fontFamily: 'var(--font)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'opacity 0.2s, transform 0.15s',
                    width: '100%',
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <>{mode === 'in' ? 'Sign in' : 'Create account'} <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </div>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font)', letterSpacing: '0.1em', textTransform: 'uppercase', color: WD, marginBottom: '0.5rem' }}>
      {label}
    </label>
    {children}
  </div>
)

const inp: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0',
  background: 'none',
  border: 'none',
  borderBottom: `1px solid ${WDD}`,
  color: '#fff',
  fontFamily: 'var(--font)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s',
}
