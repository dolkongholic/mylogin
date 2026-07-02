// 사용자 라벨 목록 관리 (localStorage). 기본값 제공 + 추가 가능.
const KEY = 'mylogin-labels'
const LEGACY_KEY = 'mylogin-categories' // 구버전 카테고리 목록 승계

export const DEFAULT_LABELS = ['업무', '개인', '금융', '쇼핑', '소셜', '개발', '게임', '기타']

export function getLabels(): string[] {
  const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_LABELS))
    return [...DEFAULT_LABELS]
  }
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as string[]) : [...DEFAULT_LABELS]
  } catch {
    return [...DEFAULT_LABELS]
  }
}

export function addLabel(name: string): string[] {
  const n = name.trim()
  const cur = getLabels()
  if (n && !cur.includes(n)) {
    cur.push(n)
    localStorage.setItem(KEY, JSON.stringify(cur))
  }
  return cur
}
