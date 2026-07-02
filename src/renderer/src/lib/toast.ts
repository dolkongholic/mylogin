import { useEffect, useState } from 'react'

export interface Toast {
  id: number
  message: string
  kind: 'info' | 'success' | 'error'
}

type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<Listener>()

function emit(): void {
  for (const l of listeners) l(toasts)
}

export function toast(message: string, kind: Toast['kind'] = 'info'): void {
  const id = nextId++
  toasts = [...toasts, { id, message, kind }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 3200)
}

export function useToasts(): Toast[] {
  const [state, setState] = useState<Toast[]>(toasts)
  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])
  return state
}
