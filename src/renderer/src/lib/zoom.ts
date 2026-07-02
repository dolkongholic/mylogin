import { useEffect, useState } from 'react'

// 콘텐츠 글자 크기(줌) 상태. localStorage 저장. 0.8~1.6 범위.
const KEY = 'mylogin-zoom'
const MIN = 0.8
const MAX = 1.6
const STEP = 0.1

function clamp(v: number): number {
  return Math.min(MAX, Math.max(MIN, Math.round(v * 100) / 100))
}

let zoom = (() => {
  const v = parseFloat(localStorage.getItem(KEY) || '1')
  return isNaN(v) ? 1 : clamp(v)
})()

const subs = new Set<(z: number) => void>()

export function setZoom(v: number): void {
  zoom = clamp(v)
  localStorage.setItem(KEY, String(zoom))
  subs.forEach((f) => f(zoom))
}

export function changeZoom(delta: number): void {
  setZoom(zoom + delta)
}

export const ZOOM_STEP = STEP
export const ZOOM_MIN = MIN
export const ZOOM_MAX = MAX

export function useZoom(): number {
  const [z, setZ] = useState(zoom)
  useEffect(() => {
    subs.add(setZ)
    return () => {
      subs.delete(setZ)
    }
  }, [])
  return z
}
