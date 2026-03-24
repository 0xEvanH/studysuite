import { useState, useEffect, type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Target, Check, Trash2, Edit2, X, ChevronDown, ChevronRight, Circle } from 'lucide-react'
import { pb } from '../../lib/pb'
import toast from 'react-hot-toast'
import type { Goal, Task } from '../../types'
import { useReveal } from '../../hooks/useReveal'
import { Divider } from '../Divider'
import { W, WD, WDD, WDDD } from '../../constants'

export const GoalsSection: FC<{ userId: string }> = ({ userId }) => {
  const [ref, visible] = useReveal()
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)

  useEffect(() => { fetchAll() }, [userId])

  const fetchAll = async () => {
    try {
      const [g, t] = await Promise.all([
        pb.collection('goals').getFullList<Goal>({ filter: `user = "${userId}"`, sort: '-created' }),
        pb.collection('tasks').getFullList<Task>({ filter: `user = "${userId}"`, sort: 'sort_order' }),
      ])
      setGoals(g); setTasks(t)
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  const toggleGoal = async (g: Goal) => {
    const updated = await pb.collection('goals').update<Goal>(g.id, { completed: !g.completed })
    setGoals(prev => prev.map(x => x.id === g.id ? updated : x))
  }

  const delGoal = async (id: string) => {
    await pb.collection('goals').delete(id)
    const goalTasks = tasks.filter(t => t.goal === id)
    await Promise.all(goalTasks.map(t => pb.collection('tasks').delete(t.id)))
    setGoals(prev => prev.filter(g => g.id !== id))
    setTasks(prev => prev.filter(t => t.goal !== id))
    toast.success('Goal deleted')
  }

  const toggleTask = async (t: Task) => {
    const updated = await pb.collection('tasks').update<Task>(t.id, { completed: !t.completed })
    setTasks(prev => prev.map(x => x.id === t.id ? updated : x))
  }

  const delTask = async (id: string) => {
    await pb.collection('tasks').delete(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const addTask = async (goalId: string, title: string) => {
    if (!title.trim()) return
    try {
      const record = await pb.collection('tasks').create<Task>({ user: pb.authStore.model?.id,
        goal: goalId,
        user: userId,
        title: title.trim(),
        completed: false,
        sort_order: tasks.filter(t => t.goal === goalId).length,
      })
      setTasks(prev => [...prev, record])
    } catch { toast.error('Failed to add task') }
  }

  const active = goals.filter(g => !g.completed)
  const done = goals.filter(g => g.completed)
  const total = tasks.length
  const doneTasks = tasks.filter(t => t.completed).length

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="sp" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 'clamp(1.6rem,3vw,2.2rem)', letterSpacing: '-0.03em', color: W, margin: 0, lineHeight: 1 }}>Goals</h2>
          <p style={{ color: WD, fontSize: '0.82rem', fontFamily: 'var(--font)', marginTop: '0.4rem' }}>{doneTasks}/{total} tasks complete</p>
        </div>
        <AddBtn onClick={() => { setEditGoal(null); setModal(true) }} label="New goal" />
      </div>

      {total > 0 && (
        <div style={{ marginBottom: '1.5rem', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.1s' }}>
          <div style={{ height: 2, background: WDDD, borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(doneTasks / total) * 100}%`, background: 'var(--a)', borderRadius: 1, transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>
      )}

      <Divider visible={visible} />

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '1.25rem' }}>
        {loading ? <Spinner /> : goals.length === 0 ? <Empty /> : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {active.map((g, i) => (
              <GoalRow key={g.id} goal={g} tasks={tasks.filter(t => t.goal === g.id)} delay={i * 0.06} visible={visible}
                onToggle={() => toggleGoal(g)} onEdit={() => { setEditGoal(g); setModal(true) }} onDelete={() => delGoal(g.id)}
                onToggleTask={toggleTask} onDeleteTask={delTask} onAddTask={addTask}
              />
            ))}
            {done.length > 0 && (
              <>
                <div style={{ padding: '1rem 0 0.5rem', opacity: 0.5 }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: WD }}>Completed</span>
                </div>
                {done.map((g, i) => (
                  <GoalRow key={g.id} goal={g} tasks={tasks.filter(t => t.goal === g.id)} delay={(active.length + i) * 0.06} visible={visible} dimmed
                    onToggle={() => toggleGoal(g)} onEdit={() => { setEditGoal(g); setModal(true) }} onDelete={() => delGoal(g.id)}
                    onToggleTask={toggleTask} onDeleteTask={delTask} onAddTask={addTask}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && <GoalModal userId={userId} existing={editGoal} onClose={() => setModal(false)} onSaved={fetchAll} />}
      </AnimatePresence>
    </section>
  )
}

const GoalRow: FC<{
  goal: Goal; tasks: Task[]; delay: number; visible: boolean; dimmed?: boolean
  onToggle: () => void; onEdit: () => void; onDelete: () => void
  onToggleTask: (t: Task) => void; onDeleteTask: (id: string) => void; onAddTask: (goalId: string, title: string) => void
}> = ({ goal, tasks, delay, visible, dimmed, onToggle, onEdit, onDelete, onToggleTask, onDeleteTask, onAddTask }) => {
  const [expanded, setExpanded] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const done = tasks.filter(t => t.completed).length

  return (
    <div style={{ opacity: visible ? (dimmed ? 0.5 : 1) : 0, transform: visible ? 'none' : 'translateY(8px)', transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s` }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 0', cursor: 'default' }}>
        <button onClick={onToggle} style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${goal.completed ? 'var(--a)' : WDD}`, background: goal.completed ? 'var(--a)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
          {goal.completed && <Check className="w-3 h-3" style={{ color: '#0a0a0a' }} />}
        </button>

        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <span style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.92rem', color: goal.completed ? WD : (hovered ? W : 'rgba(255,255,255,0.85)'), textDecoration: goal.completed ? 'line-through' : 'none', transform: hovered ? 'translateX(4px)' : 'none', display: 'inline-block', transition: 'color 0.25s, transform 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
            {goal.title}
          </span>
          {tasks.length > 0 && <span style={{ fontFamily: 'var(--font)', fontSize: '0.7rem', color: WD, marginLeft: '0.5rem' }}>{done}/{tasks.length}</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {goal.due_date && <span style={{ fontFamily: 'var(--font)', fontSize: '0.68rem', color: WD, marginRight: '0.5rem' }}>{new Date(goal.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
          <div style={{ opacity: hovered ? 1 : 0, display: 'flex', gap: '0.15rem', transition: 'opacity 0.2s' }}>
            <IconBtn icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAddingTask(true)} />
            <IconBtn icon={<Edit2 className="w-3.5 h-3.5" />} onClick={onEdit} />
            <IconBtn icon={<Trash2 className="w-3.5 h-3.5" />} onClick={onDelete} danger />
          </div>
          <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WD, padding: '0 0.2rem' }}>
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden', paddingLeft: '2.6rem' }}>
            {tasks.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleTask(t)} onDelete={() => onDeleteTask(t.id)} />)}

            {addingTask ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0' }}>
                <Circle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: WDD }} />
                <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="New task…" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') { onAddTask(goal.id, newTask); setNewTask(''); setAddingTask(false) } if (e.key === 'Escape') setAddingTask(false) }}
                  style={{ flex: 1, background: 'none', border: 'none', borderBottom: `1px solid ${WDD}`, color: W, fontFamily: 'var(--font)', fontSize: '0.82rem', padding: '0.2rem 0', outline: 'none' }}
                />
                <button onClick={() => { onAddTask(goal.id, newTask); setNewTask(''); setAddingTask(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a)' }}><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setAddingTask(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WD }}><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => setAddingTask(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: WDD, fontFamily: 'var(--font)', fontSize: '0.75rem', padding: '0.3rem 0', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = WD)} onMouseLeave={e => (e.currentTarget.style.color = WDD)}>
                <Plus className="w-3 h-3" /> Add task
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Divider visible={visible} />
    </div>
  )
}

const TaskRow: FC<{ task: Task; onToggle: () => void; onDelete: () => void }> = ({ task, onToggle, onDelete }) => {
  const [h, setH] = useState(false)
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0' }}>
      <button onClick={onToggle} style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${task.completed ? 'var(--a)' : WDD}`, background: task.completed ? 'var(--a)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
        {task.completed && <Check className="w-2.5 h-2.5" style={{ color: '#0a0a0a' }} />}
      </button>
      <span style={{ flex: 1, fontFamily: 'var(--font)', fontSize: '0.82rem', color: task.completed ? WDD : (h ? W : WD), textDecoration: task.completed ? 'line-through' : 'none', transition: 'color 0.2s' }}>{task.title}</span>
      <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WDD, opacity: h ? 1 : 0, transition: 'opacity 0.2s, color 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = WDD)}>
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

const GoalModal: FC<{ userId: string; existing: Goal | null; onClose: () => void; onSaved: () => void }> = ({ userId, existing, onClose, onSaved }) => {
  const [title, setTitle] = useState(existing?.title || '')
  const [desc, setDesc] = useState(existing?.description || '')
  const [dueDate, setDueDate] = useState(existing?.due_date || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const payload = { title: title.trim(), description: desc, due_date: dueDate || null, user: userId }
    try {
      if (existing) {
        await pb.collection('goals').update(existing.id, payload)
        toast.success('Goal updated')
      } else {
        await pb.collection('goals').create({ ...payload, completed: false, user: pb.authStore.model?.id })
        toast.success('Goal created')
      }
      onSaved(); onClose()
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={existing ? 'Edit goal' : 'New goal'} onClose={onClose} />
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal title" autoFocus style={flatInput} />
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={3} style={{ ...flatInput, resize: 'vertical' }} />
      <div>
        <label style={labelStyle}>Due date (optional)</label>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...flatInput, colorScheme: 'dark' }} />
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} label={existing ? 'Save changes' : 'Create goal'} />
    </Overlay>
  )
}

const Overlay: FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' }}
    onClick={onClose}
  >
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={e => e.stopPropagation()}
      style={{ width: '100%', maxWidth: 480, background: '#111', border: `1px solid ${WDD}`, borderRadius: 8, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {children}
    </motion.div>
  </motion.div>
)

const ModalHeader: FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1rem', color: W, letterSpacing: '-0.02em' }}>{title}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WD }}><X className="w-4 h-4" /></button>
  </div>
)

const ModalFooter: FC<{ onClose: () => void; onSave: () => void; saving: boolean; label: string }> = ({ onClose, onSave, saving, label }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: `1px solid ${WDD}` }}>
    <button onClick={onClose} style={ghostBtn}>Cancel</button>
    <button onClick={onSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : label}</button>
  </div>
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

const IconBtn: FC<{ icon: React.ReactNode; onClick: () => void; danger?: boolean }> = ({ icon, onClick, danger }) => {
  const [h, setH] = useState(false)
  return <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: 3, color: h ? (danger ? '#f87171' : W) : WD, transition: 'color 0.15s' }}>{icon}</button>
}

const Spinner = () => <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--a)', animation: 'spin 0.8s linear infinite' }} /></div>
const Empty = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '0.75rem' }}>
    <Target className="w-10 h-10" style={{ color: WDD }} />
    <p style={{ fontFamily: 'var(--font)', fontSize: '0.9rem', color: WD, margin: 0 }}>No goals yet</p>
  </div>
)

const flatInput: React.CSSProperties = { width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${WDD}`, color: W, fontFamily: 'var(--font)', fontSize: '0.9rem', padding: '0.5rem 0', outline: 'none' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.7rem', fontFamily: 'var(--font)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: WD, marginBottom: '0.4rem' }
const primaryBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1.1rem', background: 'var(--a)', color: '#0a0a0a', border: 'none', borderRadius: 4, fontFamily: 'var(--font)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.9rem', background: 'none', border: 'none', borderRadius: 4, color: WD, fontFamily: 'var(--font)', fontSize: '0.82rem', cursor: 'pointer' }
