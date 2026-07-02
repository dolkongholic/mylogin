import { useEffect, useState } from 'react'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  id: number
  resolve: (ok: boolean) => void
}

type Listener = (state: ConfirmState | null) => void

let current: ConfirmState | null = null
let nextId = 1
const listeners = new Set<Listener>()

function emit(): void {
  for (const l of listeners) l(current)
}

// 네이티브 confirm() 대체. await confirm({...}) → true/false
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  // 이전 다이얼로그가 떠 있으면 취소 처리
  if (current) current.resolve(false)
  return new Promise<boolean>((resolve) => {
    current = { ...opts, id: nextId++, resolve }
    emit()
  })
}

export function resolveConfirm(ok: boolean): void {
  if (!current) return
  current.resolve(ok)
  current = null
  emit()
}

export function useConfirm(): ConfirmState | null {
  const [state, setState] = useState<ConfirmState | null>(current)
  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])
  return state
}
