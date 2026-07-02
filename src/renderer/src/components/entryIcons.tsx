import type { JSX, ReactNode } from 'react'

// 항목용 SVG 아이콘 세트 (Feather 스타일 라인 아이콘).
// entry.icon 에는 아래 id 문자열이 저장된다. 없으면 제목 첫 글자.

interface IconDef {
  id: string
  label: string
  body: ReactNode
}

export const ENTRY_ICONS: IconDef[] = [
  { id: 'globe', label: '웹', body: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" /></>) },
  { id: 'mail', label: '메일', body: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>) },
  { id: 'key', label: '키', body: (<><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8-8M17 5l2 2M15 7l2 2" /></>) },
  { id: 'lock', label: '잠금', body: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>) },
  { id: 'shield', label: '보안', body: (<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />) },
  { id: 'card', label: '카드', body: (<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>) },
  { id: 'bank', label: '은행', body: (<><path d="m3 10 9-6 9 6" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8" /><path d="M3 20h18" /></>) },
  { id: 'wallet', label: '지갑', body: (<><path d="M3 8h15a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><path d="M3 8 16 4.5V8" /><circle cx="17" cy="13.5" r="1.2" fill="currentColor" stroke="none" /></>) },
  { id: 'cart', label: '쇼핑', body: (<><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.4 12.5h11L21 7H6" /></>) },
  { id: 'gift', label: '선물', body: (<><rect x="3" y="8" width="18" height="4" /><path d="M5 12v9h14v-9M12 8v13" /><path d="M12 8C10.5 4 7 4.5 7.5 7c.3 1.4 2.5 1 4.5 1zM12 8c1.5-4 5-3.5 4.5-1-.3 1.4-2.5 1-4.5 1z" /></>) },
  { id: 'briefcase', label: '업무', body: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>) },
  { id: 'building', label: '회사', body: (<><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></>) },
  { id: 'cloud', label: '클라우드', body: (<path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 6 18z" />) },
  { id: 'server', label: '서버', body: (<><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></>) },
  { id: 'database', label: 'DB', body: (<><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>) },
  { id: 'code', label: '코드', body: (<path d="m8 7-5 5 5 5M16 7l5 5-5 5" />) },
  { id: 'terminal', label: '터미널', body: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></>) },
  { id: 'laptop', label: '노트북', body: (<><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 20h20" /></>) },
  { id: 'phone', label: '모바일', body: (<><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></>) },
  { id: 'chat', label: '메시지', body: (<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />) },
  { id: 'user', label: '계정', body: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>) },
  { id: 'camera', label: '카메라', body: (<><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.2" /></>) },
  { id: 'image', label: '사진', body: (<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m4 18 5-5 4 3 3-2 4 4" /></>) },
  { id: 'music', label: '음악', body: (<><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>) },
  { id: 'film', label: '영상', body: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 4v16M17 4v16" /></>) },
  { id: 'play', label: '스트리밍', body: (<><circle cx="12" cy="12" r="9" /><path d="m10 8.5 6 3.5-6 3.5z" fill="currentColor" stroke="none" /></>) },
  { id: 'game', label: '게임', body: (<><rect x="2" y="7" width="20" height="10" rx="5" /><path d="M7 12h3M8.5 10.5v3" /><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="18" cy="14" r="1" fill="currentColor" stroke="none" /></>) },
  { id: 'book', label: '책', body: (<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></>) },
  { id: 'calendar', label: '캘린더', body: (<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>) },
  { id: 'star', label: '별', body: (<path d="m12 3 2.9 5.9 6.1.9-4.5 4.3 1.1 6.1L12 17.8 6.4 20.3l1.1-6.1L3 9.8l6.1-.9z" />) },
  { id: 'heart', label: '하트', body: (<path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9z" />) },
  { id: 'home', label: '홈', body: (<><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /></>) },
  { id: 'link', label: '링크', body: (<><path d="M10 13a4 4 0 0 0 6 .5l2.5-2.5a4 4 0 0 0-5.7-5.7L11.5 6.6" /><path d="M14 11a4 4 0 0 0-6-.5L5.5 13a4 4 0 0 0 5.7 5.7l1.3-1.3" /></>) },
  { id: 'wifi', label: '네트워크', body: (<><path d="M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0" /><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" /></>) },
  { id: 'bookmark', label: '북마크', body: (<path d="M6 3h12v18l-6-4-6 4z" />) }
]

export const ENTRY_ICON_MAP: Record<string, ReactNode> = Object.fromEntries(
  ENTRY_ICONS.map((i) => [i.id, i.body])
)

export function EntryGlyph({ id, size = 18 }: { id: string; size?: number }): JSX.Element | null {
  const body = ENTRY_ICON_MAP[id]
  if (!body) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {body}
    </svg>
  )
}
