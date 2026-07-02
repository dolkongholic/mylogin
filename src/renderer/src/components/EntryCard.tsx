import { useRef, type JSX } from 'react'
import { IconStar, IconChevronRight } from './icons'
import EntryAvatar from './EntryAvatar'
import { copyText } from '../lib/utils'
import { toast } from '../lib/toast'
import type { LoginEntry } from '../../../shared/types'

export interface DndHandlers {
  dragId: string | null
  overId: string | null
  overBelow: boolean
  onStart: (id: string) => void
  onOver: (id: string, below: boolean) => void
  onDrop: (id: string, below: boolean) => void
  onEnd: () => void
}

interface Props {
  entry: LoginEntry
  view: 'grid' | 'list'
  onOpen: (e: LoginEntry) => void
  dnd?: DndHandlers // 드래그 정렬 (그리드/리스트 모두)
}

// 좌클릭: 아이디 복사 / 우클릭: 비밀번호 복사 / 더블클릭: 상세 팝업
export default function EntryCard({ entry, view, onOpen, dnd }: Props): JSX.Element {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function copy(text: string, label: string): Promise<void> {
    if (!text) return toast(`${label}이(가) 비어 있습니다.`, 'error')
    await copyText(text)
    toast(`${label} 복사됨`, 'success')
  }

  function handleClick(): void {
    if (clickTimer.current) return
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      void copy(entry.username, '아이디')
    }, 220)
  }

  function handleDoubleClick(): void {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    onOpen(entry)
  }

  function handleContextMenu(e: React.MouseEvent): void {
    e.preventDefault()
    void copy(entry.password, '비밀번호')
  }

  // 리스트: 위/아래, 그리드: 좌/우 로 삽입 위치 판별
  function belowOf(e: React.DragEvent): boolean {
    const r = e.currentTarget.getBoundingClientRect()
    return view === 'list'
      ? e.clientY > r.top + r.height / 2
      : e.clientX > r.left + r.width / 2
  }

  const dragging = dnd?.dragId === entry.id
  const isOver = dnd?.overId === entry.id && dnd?.dragId !== entry.id
  const dropBefore = isOver && !dnd?.overBelow
  const dropAfter = isOver && dnd?.overBelow

  const dragProps = dnd
    ? {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', entry.id)
          dnd.onStart(entry.id)
        },
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault()
          dnd.onOver(entry.id, belowOf(e))
        },
        onDrop: (e: React.DragEvent) => {
          e.preventDefault()
          dnd.onDrop(entry.id, belowOf(e))
        },
        onDragEnd: () => dnd.onEnd()
      }
    : {}

  const handlers = {
    onClick: handleClick,
    onDoubleClick: handleDoubleClick,
    onContextMenu: handleContextMenu,
    title: '클릭: 아이디 복사 · 우클릭: 비밀번호 복사 · 더블클릭: 열기'
  }

  const dndClass = `${dnd ? 'draggable' : ''} ${dragging ? 'dragging' : ''} ${
    dropBefore ? 'drop-before' : ''
  } ${dropAfter ? 'drop-after' : ''}`

  if (view === 'list') {
    return (
      <button className={`entry-rowitem ${dndClass}`} {...handlers} {...dragProps}>
        {dnd && (
          <span className="ri-grip" aria-hidden>
            ⋮⋮
          </span>
        )}
        <EntryAvatar entry={entry} size={30} className="sm" />
        <span className="ri-title">{entry.title}</span>
        {entry.favorite && (
          <span className="ri-star">
            <IconStar size={13} />
          </span>
        )}
        <span className="ri-user">{entry.username}</span>
        {entry.labels && entry.labels.length > 0 && (
          <span className="cat-chip ri-cat">
            {entry.labels[0]}
            {entry.labels.length > 1 ? ` +${entry.labels.length - 1}` : ''}
          </span>
        )}
        <span className="entry-go">
          <IconChevronRight size={17} />
        </span>
      </button>
    )
  }

  return (
    <button className={`entry-card ${dndClass}`} {...handlers} {...dragProps}>
      <EntryAvatar entry={entry} size={36} />
      <div className="entry-info">
        <div className="entry-title-row">
          <span className="entry-title">{entry.title}</span>
          {entry.favorite && (
            <span className="ri-star">
              <IconStar size={13} />
            </span>
          )}
        </div>
        <div className="entry-sub">
          {entry.username ? (
            <span className="entry-user">{entry.username}</span>
          ) : (
            <span className="entry-user faint">아이디 없음</span>
          )}
          {entry.labels && entry.labels.length > 0 && (
            <span className="cat-chip">
              {entry.labels[0]}
              {entry.labels.length > 1 ? ` +${entry.labels.length - 1}` : ''}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
