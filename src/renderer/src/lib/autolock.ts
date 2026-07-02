import { useEffect, useState } from 'react'

// 자동 잠금 설정 (분). 0 = 사용 안 함. localStorage 저장.
const KEY = 'mylogin-autolock'

export const AUTOLOCK_OPTIONS = [
  { value: 0, label: '자동 잠금 없음' },
  { value: 1, label: '1분' },
  { value: 5, label: '5분' },
  { value: 10, label: '10분' },
  { value: 20, label: '20분' }
]

let minutes = (() => {
  const v = parseInt(localStorage.getItem(KEY) || '0', 10)
  return isNaN(v) ? 0 : v
})()

const subs = new Set<(m: number) => void>()

export function setAutoLock(m: number): void {
  minutes = m
  localStorage.setItem(KEY, String(m))
  subs.forEach((f) => f(m))
}

export function useAutoLock(): number {
  const [m, setM] = useState(minutes)
  useEffect(() => {
    subs.add(setM)
    return () => {
      subs.delete(setM)
    }
  }, [])
  return m
}
