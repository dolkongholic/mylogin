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

const MAX_TOASTS = 2

export function toast(message: string, kind: Toast['kind'] = 'info'): void {
  // 이미 같은 메시지가 떠 있으면 중복으로 띄우지 않음
  if (toasts.some((t) => t.message === message)) return
  const id = nextId++
  toasts = [...toasts, { id, message, kind }]
  // 최대 개수 유지 (오래된 것부터 제거)
  if (toasts.length > MAX_TOASTS) toasts = toasts.slice(toasts.length - MAX_TOASTS)
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
