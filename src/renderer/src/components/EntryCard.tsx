import { useRef, type JSX } from 'react'
import { IconStar, IconStarOutline, IconChevronRight } from './icons'
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
  onToggleFavorite: (e: LoginEntry) => void
  dnd?: DndHandlers
}

// 좌클릭: 아이디 복사 / 우클릭: 비밀번호 복사 / 더블클릭: 상세 팝업
export default function EntryCard({ entry, view, onOpen, onToggleFavorite, dnd }: Props): JSX.Element {
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
  function belowOf(e: React.DragEvent): boolean {
    const r = e.currentTarget.getBoundingClientRect()
    return view === 'list' ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2
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

  const rootProps = {
    role: 'button',
    tabIndex: 0,
    onClick: handleClick,
    onDoubleClick: handleDoubleClick,
    onContextMenu: handleContextMenu,
    title: '클릭: 아이디 복사 · 우클릭: 비밀번호 복사 · 더블클릭: 열기',
    ...dragProps
  }

  const dndClass = `${dnd ? 'draggable' : ''} ${dragging ? 'dragging' : ''} ${
    dropBefore ? 'drop-before' : ''
  } ${dropAfter ? 'drop-after' : ''}`

  // 즐겨찾기 토글 버튼 (공유받은 항목은 제외)
  const favBtn = !entry.shared && (
    <button
      className={`fav-toggle ${entry.favorite ? 'on' : ''}`}
      title={entry.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
      onClick={(e) => {
        e.stopPropagation()
        onToggleFavorite(entry)
      }}
    >
      {entry.favorite ? <IconStar size={14} /> : <IconStarOutline size={14} />}
    </button>
  )

  const labelChip = entry.labels && entry.labels.length > 0 && (
    <span className="cat-chip">
      {entry.labels[0]}
      {entry.labels.length > 1 ? ` +${entry.labels.length - 1}` : ''}
    </span>
  )

  if (view === 'list') {
    return (
      <div className={`entry-rowitem ${dndClass}`} {...rootProps}>
        {dnd && (
          <span className="ri-grip" aria-hidden>
            ⋮⋮
          </span>
        )}
        <EntryAvatar entry={entry} size={30} className="sm" />
        <span className="ri-title">{entry.title}</span>
        {favBtn}
        <span className="ri-user">{entry.username}</span>
        {labelChip}
        <span className="entry-go">
          <IconChevronRight size={17} />
        </span>
      </div>
    )
  }

  return (
    <div className={`entry-card ${dndClass}`} {...rootProps}>
      <EntryAvatar entry={entry} size={36} />
      <div className="entry-info">
        <div className="entry-title-row">
          <span className="entry-title">{entry.title}</span>
          {favBtn}
        </div>
        <div className="entry-sub">
          {entry.username ? (
            <span className="entry-user">{entry.username}</span>
          ) : (
            <span className="entry-user faint">아이디 없음</span>
          )}
          {labelChip}
        </div>
      </div>
    </div>
  )
}
