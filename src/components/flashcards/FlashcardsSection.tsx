import { useState, useEffect, type FC } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Layers, X, Edit2, Trash2, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react'
import { pb } from '../../lib/pb'
import toast from 'react-hot-toast'
import type { Deck, Card } from '../../types'
import { useReveal } from '../../hooks/useReveal'
import { Divider } from '../Divider'
import { DECK_COLORS, W, WD, WDD, WDDD } from '../../constants'

type View = 'decks' | 'cards' | 'study'

export const FlashcardsSection: FC<{ userId: string }> = ({ userId }) => {
  const [ref, visible] = useReveal()
  const [view, setView] = useState<View>('decks')
  const [decks, setDecks] = useState<Deck[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(true)
  const [deckModal, setDeckModal] = useState(false)
  const [cardModal, setCardModal] = useState(false)
  const [editDeck, setEditDeck] = useState<Deck | null>(null)
  const [editCard, setEditCard] = useState<Card | null>(null)
  const [queue, setQueue] = useState<Card[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => { fetchDecks() }, [userId])

  const fetchDecks = async () => {
    try {
      const records = await pb.collection('decks').getFullList<Deck>({ sort: '-created' })
      setDecks(records)
    } catch { toast.error('Failed to load decks') }
    setLoading(false)
  }

  const fetchCards = async (deckId: string) => {
    const records = await pb.collection('flashcards').getFullList<Card>({ filter: `deck = "${deckId}"`, sort: 'created' })
    setCards(records)
    return records
  }

  const openDeck = async (deck: Deck) => {
    setActiveDeck(deck)
    await fetchCards(deck.id)
    setView('cards')
  }

  const delDeck = async (id: string) => {
    await pb.collection('decks').delete(id)
    setDecks(prev => prev.filter(d => d.id !== id))
    toast.success('Deck deleted')
  }

  const delCard = async (id: string) => {
    await pb.collection('flashcards').delete(id)
    setCards(prev => prev.filter(c => c.id !== id))
    toast.success('Card deleted')
  }

  const startStudy = (shuffle = false) => {
    let q = [...cards]
    if (shuffle) q = q.sort(() => Math.random() - 0.5)
    setQueue(q); setIdx(0); setFlipped(false); setView('study')
  }

  const next = () => { setFlipped(false); setTimeout(() => setIdx(i => i + 1), 150) }
  const prev = () => { setFlipped(false); setTimeout(() => setIdx(i => Math.max(0, i - 1)), 150) }

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="sp" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {view !== 'decks' && (
            <button onClick={() => { setView(view === 'study' ? 'cards' : 'decks'); setFlipped(false) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: WD, display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font)', fontSize: '0.82rem', padding: 0 }}>
              <ChevronLeft className="w-4 h-4" />
              {view === 'study' ? activeDeck?.name : 'Decks'}
            </button>
          )}
          {view === 'decks' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 'clamp(1.6rem,3vw,2.2rem)', letterSpacing: '-0.03em', color: W, margin: 0, lineHeight: 1 }}>Flashcards</h2>
              <p style={{ color: WD, fontSize: '0.82rem', fontFamily: 'var(--font)', marginTop: '0.4rem' }}>{decks.length} deck{decks.length !== 1 ? 's' : ''}</p>
            </div>
          )}
          {view === 'cards' && activeDeck && (
            <div>
              <h2 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 'clamp(1.4rem,3vw,1.8rem)', letterSpacing: '-0.03em', color: W, margin: 0, lineHeight: 1 }}>{activeDeck.name}</h2>
              <p style={{ color: WD, fontSize: '0.82rem', fontFamily: 'var(--font)', marginTop: '0.4rem' }}>{cards.length} card{cards.length !== 1 ? 's' : ''}</p>
            </div>
          )}
          {view === 'study' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.03em', color: W, margin: 0, lineHeight: 1 }}>Study mode</h2>
              <p style={{ color: WD, fontSize: '0.82rem', fontFamily: 'var(--font)', marginTop: '0.4rem' }}>{idx + 1} / {queue.length}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {view === 'decks' && <Btn onClick={() => { setEditDeck(null); setDeckModal(true) }} label="New deck" />}
          {view === 'cards' && (
            <>
              {cards.length > 0 && (
                <>
                  <Btn onClick={() => startStudy(true)} label="Shuffle" icon={<Shuffle className="w-3.5 h-3.5" />} ghost />
                  <Btn onClick={() => startStudy(false)} label="Study" />
                </>
              )}
              <Btn onClick={() => { setEditCard(null); setCardModal(true) }} label="New card" />
            </>
          )}
        </div>
      </div>

      <Divider visible={visible} />

      <div style={{ flex: 1, overflowY: view === 'study' ? 'visible' : 'auto', paddingTop: '1.5rem' }}>
        {loading ? <Spinner /> :
          view === 'decks' ? <DeckGrid decks={decks} visible={visible} onOpen={openDeck} onEdit={d => { setEditDeck(d); setDeckModal(true) }} onDelete={delDeck} /> :
          view === 'cards' ? <CardList cards={cards} visible={visible} onEdit={c => { setEditCard(c); setCardModal(true) }} onDelete={delCard} /> :
          <StudyView queue={queue} index={idx} flipped={flipped} onFlip={() => setFlipped(!flipped)} onNext={next} onPrev={prev} onReset={() => { setIdx(0); setFlipped(false) }} />
        }
      </div>

      <AnimatePresence>
        {deckModal && <DeckModal userId={userId} existing={editDeck} onClose={() => setDeckModal(false)} onSaved={fetchDecks} />}
        {cardModal && activeDeck && <CardModal userId={userId} deckId={activeDeck.id} existing={editCard} onClose={() => setCardModal(false)} onSaved={() => fetchCards(activeDeck.id)} />}
      </AnimatePresence>
    </section>
  )
}

const DeckGrid: FC<{ decks: Deck[]; visible: boolean; onOpen: (d: Deck) => void; onEdit: (d: Deck) => void; onDelete: (id: string) => void }> = ({ decks, visible, onOpen, onEdit, onDelete }) => {
  if (!decks.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 0', gap: '0.75rem' }}>
      <Layers className="w-10 h-10" style={{ color: WDD }} />
      <p style={{ fontFamily: 'var(--font)', fontSize: '0.9rem', color: WD, margin: 0 }}>No decks yet</p>
    </div>
  )
  return (
    <div className="deck-grid">
      {decks.map((d, i) => <DeckCard key={d.id} deck={d} delay={i * 0.05} visible={visible} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  )
}

const DeckCard: FC<{ deck: Deck; delay: number; visible: boolean; onOpen: (d: Deck) => void; onEdit: (d: Deck) => void; onDelete: (id: string) => void }> = ({ deck, delay, visible, onOpen, onEdit, onDelete }) => {
  const [h, setH] = useState(false)
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={() => onOpen(deck)}
      style={{ padding: '1.1rem', borderRadius: 6, border: `1px solid ${h ? deck.color + '55' : WDD}`, cursor: 'pointer', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transition: `opacity 0.55s ease ${delay}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}s, border-color 0.2s`, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: deck.color, opacity: h ? 1 : 0.5, transition: 'opacity 0.2s' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', marginTop: '0.35rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: deck.color, flexShrink: 0 }} />
        <div style={{ display: 'flex', gap: '0.1rem', opacity: h ? 1 : 0, transition: 'opacity 0.2s' }} onClick={e => e.stopPropagation()}>
          <IconBtn icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => onEdit(deck)} />
          <IconBtn icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => onDelete(deck.id)} danger />
        </div>
      </div>
      <h3 style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.9rem', color: h ? W : 'rgba(255,255,255,0.85)', margin: '0 0 0.3rem', letterSpacing: '-0.01em', transform: h ? 'translateX(3px)' : 'none', transition: 'color 0.2s, transform 0.3s cubic-bezier(0.16,1,0.3,1)' }}>{deck.name}</h3>
      {deck.description && <p style={{ fontFamily: 'var(--font)', fontSize: '0.75rem', color: WD, margin: 0, lineHeight: 1.4 }}>{deck.description}</p>}
    </div>
  )
}

const CardList: FC<{ cards: Card[]; visible: boolean; onEdit: (c: Card) => void; onDelete: (id: string) => void }> = ({ cards, visible, onEdit, onDelete }) => {
  if (!cards.length) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}><p style={{ fontFamily: 'var(--font)', fontSize: '0.9rem', color: WD, margin: 0 }}>No cards yet — add your first</p></div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {cards.map((c, i) => <CardRow key={c.id} card={c} delay={i * 0.04} visible={visible} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  )
}

const CardRow: FC<{ card: Card; delay: number; visible: boolean; onEdit: (c: Card) => void; onDelete: (id: string) => void }> = ({ card, delay, visible, onEdit, onDelete }) => {
  const [h, setH] = useState(false)
  return (
    <div>
      <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', alignItems: 'center', gap: '1.5rem', padding: '0.75rem 0', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s` }}
      >
        <span style={{ fontFamily: 'var(--font)', fontSize: '0.85rem', color: h ? W : 'rgba(255,255,255,0.85)', transition: 'color 0.2s, transform 0.3s', transform: h ? 'translateX(4px)' : 'none' }}>{card.front}</span>
        <span style={{ fontFamily: 'var(--font)', fontSize: '0.82rem', color: WD, fontStyle: 'italic' }}>{card.back}</span>
        <div style={{ display: 'flex', gap: '0.25rem', opacity: h ? 1 : 0, transition: 'opacity 0.2s' }}>
          <IconBtn icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => onEdit(card)} />
          <IconBtn icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => onDelete(card.id)} danger />
        </div>
      </div>
      <Divider visible={visible} />
    </div>
  )
}

const StudyView: FC<{ queue: Card[]; index: number; flipped: boolean; onFlip: () => void; onNext: () => void; onPrev: () => void; onReset: () => void }> = ({ queue, index, flipped, onFlip, onNext, onPrev, onReset }) => {
  if (!queue.length) return <p style={{ fontFamily: 'var(--font)', color: WD, textAlign: 'center', paddingTop: '4rem' }}>No cards to study</p>
  if (index >= queue.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1.5rem' }}>
      <p style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', color: W, margin: 0 }}>All done!</p>
      <p style={{ fontFamily: 'var(--font)', fontSize: '0.85rem', color: WD, margin: 0 }}>You reviewed all {queue.length} cards</p>
      <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', background: 'var(--a)', color: '#0a0a0a', border: 'none', borderRadius: 4, fontFamily: 'var(--font)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
        <RotateCcw className="w-4 h-4" /> Start over
      </button>
    </div>
  )

  const card = queue[index]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: '2rem' }}>
      <div style={{ perspective: 1000, width: '100%', maxWidth: 520, cursor: 'pointer' }} onClick={onFlip}>
        <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }} style={{ transformStyle: 'preserve-3d', position: 'relative', height: 240 }}>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', border: `1px solid ${WDD}`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#0f0f0f' }}>
            <span style={{ fontFamily: 'var(--font)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: WD, marginBottom: '1.25rem' }}>Front</span>
            <p style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '1.1rem', color: W, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>{card.front}</p>
            <span style={{ position: 'absolute', bottom: '1rem', fontSize: '0.7rem', color: WDD, fontFamily: 'var(--font)' }}>Click to reveal</span>
          </div>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', border: '1px solid var(--ad)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--ag)' }}>
            <span style={{ fontFamily: 'var(--font)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--a)', marginBottom: '1.25rem' }}>Back</span>
            <p style={{ fontFamily: 'var(--font)', fontSize: '1rem', color: W, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>{card.back}</p>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button onClick={onPrev} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? WDD : WD, transition: 'color 0.2s' }}
          onMouseEnter={e => { if (index > 0) (e.currentTarget as HTMLElement).style.color = W }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = index === 0 ? WDD : WD }}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span style={{ fontFamily: 'var(--font)', fontSize: '0.78rem', color: WD }}>{index + 1} / {queue.length}</span>
        <button onClick={onNext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WD, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = W)} onMouseLeave={e => (e.currentTarget.style.color = WD)}>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

const DeckModal: FC<{ userId: string; existing: Deck | null; onClose: () => void; onSaved: () => void }> = ({ userId, existing, onClose, onSaved }) => {
  const [name, setName] = useState(existing?.name || '')
  const [desc, setDesc] = useState(existing?.description || '')
  const [color, setColor] = useState(existing?.color || DECK_COLORS[0])
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      const payload = { name: name.trim(), description: desc, color, user: userId }
      if (existing) {
        await pb.collection('decks').update(existing.id, payload)
        toast.success('Deck updated')
      } else {
        await pb.collection('decks').create({ ...payload, user: pb.authStore.model?.id })
        toast.success('Deck created')
      }
      onSaved(); onClose()
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  return (
    <Modal title={existing ? 'Edit deck' : 'New deck'} onClose={onClose}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Deck name" autoFocus style={flatInput} />
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={2} style={{ ...flatInput, resize: 'vertical' }} />
      <div>
        <label style={labelStyle}>Colour</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {DECK_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: `2px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer', transition: 'border-color 0.15s' }} />
          ))}
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} label={existing ? 'Save changes' : 'Create deck'} />
    </Modal>
  )
}

const CardModal: FC<{ userId: string; deckId: string; existing: Card | null; onClose: () => void; onSaved: () => void }> = ({ userId, deckId, existing, onClose, onSaved }) => {
  const [front, setFront] = useState(existing?.front || '')
  const [back, setBack] = useState(existing?.back || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!front.trim() || !back.trim()) { toast.error('Both sides required'); return }
    setSaving(true)
    try {
      const payload = { front: front.trim(), back: back.trim(), deck: deckId, user: userId }
      if (existing) {
        await pb.collection('flashcards').update(existing.id, payload)
        toast.success('Card updated')
      } else {
        await pb.collection('flashcards').create({ ...payload, user: pb.authStore.model?.id })
        toast.success('Card created')
      }
      onSaved(); onClose()
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  return (
    <Modal title={existing ? 'Edit card' : 'New card'} onClose={onClose}>
      <div>
        <label style={labelStyle}>Front</label>
        <textarea value={front} onChange={e => setFront(e.target.value)} placeholder="Question or term…" rows={3} autoFocus style={{ ...flatInput, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>Back</label>
        <textarea value={back} onChange={e => setBack(e.target.value)} placeholder="Answer or definition…" rows={3} style={{ ...flatInput, resize: 'vertical' }} />
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} label={existing ? 'Save changes' : 'Create card'} />
    </Modal>
  )
}

const Modal: FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' }}
    onClick={onClose}
  >
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={e => e.stopPropagation()}
      style={{ width: '100%', maxWidth: 480, background: '#111', border: `1px solid ${WDD}`, borderRadius: 8, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1rem', color: W, letterSpacing: '-0.02em' }}>{title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WD }}><X className="w-4 h-4" /></button>
      </div>
      {children}
    </motion.div>
  </motion.div>
)

const ModalFooter: FC<{ onClose: () => void; onSave: () => void; saving: boolean; label: string }> = ({ onClose, onSave, saving, label }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: `1px solid ${WDD}` }}>
    <button onClick={onClose} style={ghostBtn}>Cancel</button>
    <button onClick={onSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : label}</button>
  </div>
)

const Btn: FC<{ onClick: () => void; label: string; icon?: React.ReactNode; ghost?: boolean }> = ({ onClick, label, icon, ghost }) => {
  const [h, setH] = useState(false)
  if (ghost) return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: h ? WDDD : 'transparent', color: h ? W : WD, border: `1px solid ${WDD}`, borderRadius: 4, fontFamily: 'var(--font)', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }}>
      {icon || <Plus className="w-3.5 h-3.5" />}{label}
    </button>
  )
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: h ? 'var(--ab)' : 'var(--a)', color: '#0a0a0a', border: 'none', borderRadius: 4, fontFamily: 'var(--font)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s, transform 0.15s', transform: h ? 'translateY(-1px)' : 'none' }}>
      {icon || <Plus className="w-3.5 h-3.5" />}{label}
    </button>
  )
}

const IconBtn: FC<{ icon: React.ReactNode; onClick: () => void; danger?: boolean }> = ({ icon, onClick, danger }) => {
  const [h, setH] = useState(false)
  return <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: 3, color: h ? (danger ? '#f87171' : W) : WD, transition: 'color 0.15s' }}>{icon}</button>
}

const Spinner = () => <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--a)', animation: 'spin 0.8s linear infinite' }} /></div>

const flatInput: React.CSSProperties = { width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${WDD}`, color: W, fontFamily: 'var(--font)', fontSize: '0.9rem', padding: '0.5rem 0', outline: 'none' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.7rem', fontFamily: 'var(--font)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: WD, marginBottom: '0.4rem' }
const primaryBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1.1rem', background: 'var(--a)', color: '#0a0a0a', border: 'none', borderRadius: 4, fontFamily: 'var(--font)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.9rem', background: 'none', border: 'none', borderRadius: 4, color: WD, fontFamily: 'var(--font)', fontSize: '0.82rem', cursor: 'pointer' }
