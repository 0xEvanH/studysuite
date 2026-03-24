import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pb } from '../../lib/pb'
import toast from 'react-hot-toast'
import { BookOpen, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
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
        await pb.collection('users').create({
          email,
          password,
          passwordConfirm: password,
        })
        await pb.collection('users').authWithPassword(email, password)
        toast.success('Account created.')
      } else {
        await pb.collection('users').authWithPassword(email, password)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0a0a' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 30% 40%, var(--ag) 0%, transparent 65%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-12">
          <div
            className="w-10 h-10 flex items-center justify-center rounded-lg mb-8"
            style={{ background: 'var(--ag)', border: '1px solid var(--ad)' }}
          >
            <BookOpen className="w-5 h-5" style={{ color: 'var(--a)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 'clamp(1.8rem,4vw,2.4rem)', letterSpacing: '-0.03em', color: '#fff', lineHeight: 1, margin: 0 }}>
            StudyVault
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: WD, fontFamily: 'var(--font)' }}>
            {mode === 'in' ? 'Sign in to your vault' : 'Create your vault'}
          </p>
        </div>

        <div className="flex gap-0 mb-8" style={{ borderBottom: `1px solid ${WDD}` }}>
          {(['in', 'up'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '0 0 0.75rem',
                marginRight: '1.5rem',
                fontSize: '0.8rem',
                fontFamily: 'var(--font)',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: mode === m ? '#fff' : WD,
                background: 'none',
                border: 'none',
                borderBottom: mode === m ? '2px solid var(--a)' : '2px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {m === 'in' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={submit}
          >
            <div className="flex flex-col gap-5">
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontFamily: 'var(--font)', letterSpacing: '0.1em', textTransform: 'uppercase', color: WD, marginBottom: '0.5rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@uni.edu"
                  required
                  style={{ width: '100%', padding: '0.75rem 0', background: 'none', border: 'none', borderBottom: `1px solid ${WDD}`, color: '#fff', fontFamily: 'var(--font)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderBottomColor = 'var(--a)')}
                  onBlur={e => (e.target.style.borderBottomColor = WDD)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontFamily: 'var(--font)', letterSpacing: '0.1em', textTransform: 'uppercase', color: WD, marginBottom: '0.5rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    style={{ width: '100%', padding: '0.75rem 2rem 0.75rem 0', background: 'none', border: 'none', borderBottom: `1px solid ${WDD}`, color: '#fff', fontFamily: 'var(--font)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => (e.target.style.borderBottomColor = 'var(--a)')}
                    onBlur={e => (e.target.style.borderBottomColor = WDD)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: WD, padding: 0 }}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', background: 'var(--a)', color: '#0a0a0a', border: 'none', borderRadius: '4px', fontFamily: 'var(--font)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.02em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s, transform 0.15s' }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>{mode === 'in' ? 'Sign in' : 'Create account'}<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
