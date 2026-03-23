import { useState, useEffect, useCallback, type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Edit2, Trash2, Tag, StickyNote } from 'lucide-react'
import { pb } from '../../lib/pb'
import toast from 'react-hot-toast'
import type { Note } from '../../types'
import { useSettings } from '../../hooks/useSettings'
import { CATEGORIES, TAG_OPTIONS, W, WD, WDD, WDDD } from '../../constants'
import { Divider } from '../Divider'
import { useReveal } from '../../hooks/useReveal'

export const NotesSection: FC<{ userId: string }> = ({ userId }) => {
  const { s } = useSettings()
  const [ref, visible] = useReveal()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [editor, setEditor] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [viewer, setViewer] = useState<Note | null>(null)

  const load = useCallback(async () => {
    try {
      const records = await pb.collection('notes').getFullList<Note>({ sort: '-updated' })
      setNotes(records)
    } catch {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let alive = true
    let unsubFn: (() => void) | null = null

    load()

    pb.collection('notes').subscribe('*', () => {
      if (alive) load()
    }).then(fn => {
      if (alive) {
        unsubFn = fn as unknown as () => void
      } else {
        (fn as unknown as () => void)()
      }
    }).catch(() => {})

    return () => {
      alive = false
      if (unsubFn) unsubFn()
      else pb.collection('notes').unsubscribe('*').catch(() => {})
    }
  }, [load])

  const openCreate = () => { setEditing(null); setEditor(true) }
  const openEdit = (n: Note) => { setEditing(n); setViewer(null); setEditor(true) }

  const del = async (id: string) => {
    try {
      await pb.collection('notes').delete(id)
      setNotes(prev => prev.filter(n => n.id !== id))
      toast.success('Note deleted')
      if (viewer?.id === id) setViewer(null)
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = notes.filter(n => {
    const q = search.toLowerCase()
    return (
      (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) &&
      (catFilter === 'all' || n.category === catFilter) &&
      (tagFilter.length === 0 || tagFilter.some(t => n.tags?.includes(t)))
    )
  })

  const cats = [...new Set(notes.map(n => n.category))]

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={{ padding: '2.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 'clamp(1.6rem,3vw,2.2rem)', letterSpacing: '-0.03em', color: W, margin: 0, lineHeight: 1 }}>Notes</h2>
          <p style={{ color: WD, fontSize: '0.82rem', fontFamily: 'var(--font)', marginTop: '0.4rem' }}>{notes.length} notes · {cats.length} categories</p>
        </div>
        <AddBtn onClick={openCreate} label="New note" />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: 'opacity 0.5s ease 0.1s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s' }}>
        <SearchInput value={search} onChange={setSearch} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selectStyle}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.15s' }}>
        {TAG_OPTIONS.map(t => (
          <TagChip key={t} label={t} active={tagFilter.includes(t)}
            onClick={() => setTagFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} />
        ))}
      </div>

      <Divider visible={visible} />

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '1.5rem' }}>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty /> : (
          <NotesGrid notes={filtered} layout={s.noteLayout} cardStyle={s.cardStyle} visible={visible}
            onEdit={openEdit} onDelete={del} onView={setViewer} />
        )}
      </div>

      <AnimatePresence>
        {editor && (
          <NoteEditor userId={userId} existing={editing} onClose={() => setEditor(false)}
            onSaved={(n) => {
              setNotes(prev => editing ? prev.map(x => x.id === n.id ? n : x) : [n, ...prev])
              setEditor(false)
            }} />
        )}
        {viewer && !editor && (
          <NoteViewer note={viewer} onClose={() => setViewer(null)}
            onEdit={() => openEdit(viewer)} onDelete={() => del(viewer.id)} />
        )}
      </AnimatePresence>
    </section>
  )
}

const NotesGrid: FC<{
  notes: Note[]; layout: string; cardStyle: string; visible: boolean
  onEdit: (n: Note) => void; onDelete: (id: string) => void; onView: (n: Note) => void
}> = ({ notes, layout, cardStyle, visible, onEdit, onDelete, onView }) => {
  if (layout === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {notes.map((note, i) => (
          <ListRow key={note.id} note={note} delay={i * 0.04} visible={visible}
            cardStyle={cardStyle} onEdit={onEdit} onDelete={onDelete} onView={onView} />
        ))}
      </div>
    )
  }
  const cols = layout === 'dense' ? 4 : 3
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: layout === 'dense' ? '0.75rem' : '1rem' }}>
      {notes.map((note, i) => (
        <GridCard key={note.id} note={note} delay={i * 0.04} visible={visible}
          cardStyle={cardStyle} onEdit={onEdit} onDelete={onDelete} onView={onView} />
      ))}
    </div>
  )
}

const GridCard: FC<{
  note: Note; delay: number; visible: boolean; cardStyle: string
  onEdit: (n: Note) => void; onDelete: (id: string) => void; onView: (n: Note) => void
}> = ({ note, delay, visible, cardStyle, onEdit, onDelete, onView }) => {
  const [hovered, setHovered] = useState(false)
  const bg = cardStyle === 'filled' ? 'rgba(255,255,255,0.04)' : 'transparent'
  const border = cardStyle === 'minimal'
    ? `1px solid ${hovered ? WDD : 'transparent'}`
    : cardStyle === 'bordered'
    ? `1px solid ${hovered ? 'var(--a)' : WDD}`
    : `1px solid ${WDD}`

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => onView(note)}
      style={{ padding: '1.25rem', borderRadius: 6, background: bg, border, cursor: 'pointer', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transition: `opacity 0.55s ease ${delay}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}s, background 0.2s, border-color 0.2s` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <h3 style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.92rem', color: hovered ? W : 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em', transform: hovered ? 'translateX(3px)' : 'none', transition: 'color 0.2s, transform 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
          {note.title}
        </h3>
        <div style={{ display: 'flex', gap: '0.15rem', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }} onClick={e => e.stopPropagation()}>
          <IconBtn icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => onEdit(note)} />
          <IconBtn icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => onDelete(note.id)} danger />
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font)', fontSize: '0.78rem', color: WD, lineHeight: 1.5, margin: '0 0 0.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {note.content}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font)', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--a)', padding: '0.15rem 0.5rem', background: 'var(--ag)', borderRadius: 3 }}>
          {note.category}
        </span>
        <span style={{ fontFamily: 'var(--font)', fontSize: '0.7rem', color: WDD }}>
          {new Date(note.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      {note.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
          {note.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontFamily: 'var(--font)', fontSize: '0.65rem', color: WD, padding: '0.1rem 0.4rem', background: WDDD, borderRadius: 3 }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

const ListRow: FC<{
  note: Note; delay: number; visible: boolean; cardStyle: string
  onEdit: (n: Note) => void; onDelete: (id: string) => void; onView: (n: Note) => void
}> = ({ note, delay, visible, cardStyle, onEdit, onDelete, onView }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onClick={() => onView(note)}
        style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px auto', alignItems: 'center', gap: '1rem', padding: '0.85rem 0', cursor: 'pointer', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s`, background: cardStyle === 'filled' && hovered ? WDDD : 'transparent' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <StickyNote className="w-3.5 h-3.5 flex-shrink-0" style={{ color: WDD }} />
          <span style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.88rem', color: hovered ? W : 'rgba(255,255,255,0.85)', transform: hovered ? 'translateX(4px)' : 'none', transition: 'color 0.25s, transform 0.35s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {note.title}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--a)' }}>{note.category}</span>
        <span style={{ fontFamily: 'var(--font)', fontSize: '0.75rem', color: WD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {note.content.slice(0, 60)}{note.content.length > 60 ? '…' : ''}
        </span>
        <div style={{ display: 'flex', gap: '0.25rem', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }} onClick={e => e.stopPropagation()}>
          <IconBtn icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => onEdit(note)} />
          <IconBtn icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => onDelete(note.id)} danger />
        </div>
      </div>
      <Divider visible={visible} />
    </div>
  )
}

const NoteEditor: FC<{
  userId: string; existing: Note | null
  onClose: () => void; onSaved: (n: Note) => void
}> = ({ userId, existing, onClose, onSaved }) => {
  const [title, setTitle] = useState(existing?.title || '')
  const [content, setContent] = useState(existing?.content || '')
  const [cat, setCat] = useState(existing?.category || 'General')
  const [tags, setTags] = useState<string[]>(existing?.tags || [])
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const payload = { title: title.trim(), content, category: cat, tags }
    try {
      let record: Note
      if (existing) {
        record = await pb.collection('notes').update<Note>(existing.id, payload)
        toast.success('Saved')
      } else {
        record = await pb.collection('notes').create<Note>({ ...payload, user: userId })
        toast.success('Note created')
      }
      onSaved(record)
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, background: '#111', border: `1px solid ${WDD}`, borderRadius: 8, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1rem', color: W, letterSpacing: '-0.02em' }}>{existing ? 'Edit note' : 'New note'}</span>
          <button onClick={onClose} style={iconBtnBase}><X className="w-4 h-4" /></button>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" autoFocus style={{ ...flatInput, fontSize: '1.1rem', fontWeight: 600 }} />
        <select value={cat} onChange={e => setCat(e.target.value)} style={flatInput}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your notes here…" rows={8} style={{ ...flatInput, resize: 'vertical', minHeight: 160 }} />
        <div>
          <div style={{ fontFamily: 'var(--font)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: WD, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Tag className="w-3 h-3" /> Tags
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {TAG_OPTIONS.map(t => (
              <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                style={{ padding: '0.2rem 0.6rem', borderRadius: 3, fontSize: '0.72rem', fontFamily: 'var(--font)', background: tags.includes(t) ? 'var(--ag)' : 'transparent', border: `1px solid ${tags.includes(t) ? 'var(--ad)' : WDD}`, color: tags.includes(t) ? 'var(--a)' : WD, cursor: 'pointer', transition: 'all 0.15s' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: `1px solid ${WDD}` }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Create note'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const NoteViewer: FC<{ note: Note; onClose: () => void; onEdit: () => void; onDelete: () => void }> = ({ note, onClose, onEdit, onDelete }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' }}
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={e => e.stopPropagation()}
      style={{ width: '100%', maxWidth: 660, maxHeight: '80vh', background: '#111', border: `1px solid ${WDD}`, borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ padding: '1.5rem 1.75rem 1rem', borderBottom: `1px solid ${WDD}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', color: W, margin: 0 }}>{note.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--a)' }}>{note.category}</span>
              <span style={{ fontFamily: 'var(--font)', fontSize: '0.72rem', color: WD }}>{new Date(note.updated).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onClose} style={iconBtnBase}><X className="w-4 h-4" /></button>
        </div>
        {note.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {note.tags.map(t => <span key={t} style={{ fontFamily: 'var(--font)', fontSize: '0.65rem', color: WD, padding: '0.1rem 0.4rem', background: WDDD, borderRadius: 3 }}>{t}</span>)}
          </div>
        )}
      </div>
      <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', flex: 1 }}>
        <p style={{ fontFamily: 'var(--font)', fontSize: '0.88rem', color: WD, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{note.content}</p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.75rem', borderTop: `1px solid ${WDD}` }}>
        <button onClick={onEdit} style={outlineBtn}><Edit2 className="w-3.5 h-3.5" /> Edit</button>
        <button onClick={onDelete} style={{ ...ghostBtn, color: '#f87171' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </motion.div>
  </motion.div>
)

const AddBtn: FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: h ? 'var(--ab)' : 'var(--a)', color: '#0a0a0a', border: 'none', borderRadius: 4, fontFamily: 'var(--font)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s, transform 0.15s', transform: h ? 'translateY(-1px)' : 'none' }}>
      <Plus className="w-3.5 h-3.5" />{label}
    </button>
  )
}

const SearchInput: FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
    <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: WD }} />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder="Search notes…"
      style={{ ...selectStyle, paddingLeft: '2.2rem', width: '100%' }} />
  </div>
)

const TagChip: FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: 3, background: active ? 'var(--ag)' : 'transparent', border: `1px solid ${active ? 'var(--ad)' : WDD}`, color: active ? 'var(--a)' : WD, fontFamily: 'var(--font)', fontSize: '0.7rem', letterSpacing: '0.04em', cursor: 'pointer', transition: 'all 0.15s' }}>
    <Tag className="w-2.5 h-2.5" />{label}
  </button>
)

const IconBtn: FC<{ icon: React.ReactNode; onClick: () => void; danger?: boolean }> = ({ icon, onClick, danger }) => {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: 3, color: h ? (danger ? '#f87171' : W) : WD, transition: 'color 0.15s' }}>
      {icon}
    </button>
  )
}

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--a)', animation: 'spin 0.8s linear infinite' }} />
  </div>
)

const Empty = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '0.75rem' }}>
    <StickyNote className="w-10 h-10" style={{ color: WDD }} />
    <p style={{ fontFamily: 'var(--font)', fontSize: '0.9rem', color: WD, margin: 0 }}>No notes found</p>
    <p style={{ fontFamily: 'var(--font)', fontSize: '0.78rem', color: WDD, margin: 0 }}>Try adjusting filters or create a new note</p>
  </div>
)

const selectStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: `1px solid ${WDD}`, borderRadius: 4, padding: '0.5rem 0.75rem', color: W, fontFamily: 'var(--font)', fontSize: '0.82rem', outline: 'none' }
const flatInput: React.CSSProperties = { width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${WDD}`, color: W, fontFamily: 'var(--font)', fontSize: '0.9rem', padding: '0.5rem 0', outline: 'none' }
const primaryBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1.1rem', background: 'var(--a)', color: '#0a0a0a', border: 'none', borderRadius: 4, fontFamily: 'var(--font)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.9rem', background: 'none', border: 'none', borderRadius: 4, color: WD, fontFamily: 'var(--font)', fontSize: '0.82rem', cursor: 'pointer' }
const outlineBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.9rem', background: 'none', border: `1px solid ${WDD}`, borderRadius: 4, color: WD, fontFamily: 'var(--font)', fontSize: '0.82rem', cursor: 'pointer' }
const iconBtnBase: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: WD, padding: 0 }
