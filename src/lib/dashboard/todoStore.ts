/** Lightweight staff to-do list on Dashboard — browser-only. */

export type TodoItem = {
  id: string
  text: string
  done: boolean
  createdAt: string
}

const KEY = 'prism_dashboard_todos_v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return (JSON.parse(raw) as T) ?? fallback
  } catch {
    return fallback
  }
}

export function loadTodos(): TodoItem[] {
  const list = readJson<TodoItem[]>(KEY, [])
  return Array.isArray(list) ? list : []
}

export function saveTodos(list: TodoItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}
