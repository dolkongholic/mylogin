// 항목 수동 정렬 순서 (localStorage). 드래그로 바꾼 순서를 id 배열로 저장.
const KEY = 'mylogin-order'

export function getOrder(): string[] {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(a) ? (a as string[]) : []
  } catch {
    return []
  }
}

export function saveOrder(ids: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(ids))
}

// 저장된 순서로 정렬. 순서에 없는 항목은 뒤로(제목순).
export function sortByOrder<T extends { id: string; title: string }>(
  list: T[],
  order: string[]
): T[] {
  const idx = new Map(order.map((id, i) => [id, i]))
  return [...list].sort((a, b) => {
    const ai = idx.has(a.id) ? (idx.get(a.id) as number) : Infinity
    const bi = idx.has(b.id) ? (idx.get(b.id) as number) : Infinity
    if (ai !== bi) return ai - bi
    return a.title.localeCompare(b.title, 'ko')
  })
}
