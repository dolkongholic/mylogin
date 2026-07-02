// 비밀번호 생성기
export interface GenOptions {
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  symbols: boolean
}

export function generatePassword(opts: GenOptions): string {
  const sets: string[] = []
  if (opts.lower) sets.push('abcdefghijkmnpqrstuvwxyz')
  if (opts.upper) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ')
  if (opts.digits) sets.push('23456789')
  if (opts.symbols) sets.push('!@#$%^&*()-_=+[]{}')
  if (sets.length === 0) sets.push('abcdefghijkmnpqrstuvwxyz')
  const all = sets.join('')
  const arr = new Uint32Array(opts.length)
  crypto.getRandomValues(arr)
  let out = ''
  for (let i = 0; i < opts.length; i++) {
    out += all[arr[i] % all.length]
  }
  return out
}

// 비밀번호 강도 (0~4)
export function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  score = Math.min(4, score)
  const labels = ['매우 약함', '약함', '보통', '강함', '매우 강함']
  const colors = ['#f0556a', '#f0556a', '#f5b14c', '#34c98a', '#34c98a']
  if (!pw) return { score: 0, label: '', color: '#f0556a' }
  return { score, label: labels[score], color: colors[score] }
}

// 제목 기반 일관된 아바타 색
const AVATAR_COLORS = [
  '#5b8cff', '#7a5bff', '#f5556a', '#34c98a', '#f5b14c',
  '#e056a8', '#3fb6d3', '#ff8a4c', '#8b5cf6', '#10b981'
]

export function avatarColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function initials(title: string): string {
  const t = title.trim()
  if (!t) return '?'
  return t.slice(0, 1).toUpperCase()
}

// 항목 아이콘 선택지 (이모지). 미선택 시 제목 첫 글자 사용.
export const ICON_CHOICES = [
  '🌐', '✉️', '📧', '🔑', '🔒', '🛡️', '💳', '🏦', '💰', '🛒',
  '💼', '🏢', '☁️', '💻', '🖥️', '🗄️', '📱', '💬', '👤', '🔔',
  '🎮', '🎵', '🎬', '📺', '📷', '🎨', '📝', '🔖', '📦', '🚀',
  '⚙️', '💡', '🎁', '✈️', '🏠', '❤️', '⭐', '🍔', '☕', '🐙'
]

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

export function timeAgo(iso?: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  return `${d}일 전`
}
