export type Section = 'notes' | 'timer' | 'goals' | 'flashcards' | 'settings'

export type Theme = 'default' | 'warm' | 'cool' | 'rose' | 'violet'

export type FontStyle = 'sans' | 'serif' | 'mono'

export type NoteLayout = 'grid' | 'list' | 'dense'

export type CardStyle = 'minimal' | 'bordered' | 'filled'

export interface Settings {
  theme: Theme
  font: FontStyle
  noteLayout: NoteLayout
  cardStyle: CardStyle
  sidebarLabels: boolean
  timerSound: boolean
  pomodoroMins: number
  shortBreakMins: number
  longBreakMins: number
}

export const defaultSettings: Settings = {
  theme: 'default',
  font: 'sans',
  noteLayout: 'grid',
  cardStyle: 'minimal',
  sidebarLabels: true,
  timerSound: true,
  pomodoroMins: 25,
  shortBreakMins: 5,
  longBreakMins: 15,
}

export interface Note {
  id: string
  user: string
  title: string
  content: string
  category: string
  tags: string[]
  created: string
  updated: string
}

export interface TimerLog {
  id: string
  user: string
  subject: string
  duration: number
  mode: string
  created: string
}

export interface Goal {
  id: string
  user: string
  title: string
  description: string
  completed: boolean
  due_date: string
  created: string
}

export interface Task {
  id: string
  goal: string
  user: string
  title: string
  completed: boolean
  sort_order: number
  created: string
}

export interface Deck {
  id: string
  user: string
  name: string
  description: string
  color: string
  created: string
}

export interface Card {
  id: string
  deck: string
  user: string
  front: string
  back: string
  created: string
}
