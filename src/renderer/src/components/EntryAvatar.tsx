import { useState, type JSX } from 'react'
import { avatarColor, initials } from '../lib/utils'
import { ENTRY_ICON_MAP, EntryGlyph } from './entryIcons'
import type { LoginEntry } from '../../../shared/types'

interface Props {
  entry: Pick<LoginEntry, 'title' | 'icon' | 'url'>
  size?: number
  className?: string
}

// URL의 파비콘을 도메인 기준으로 가져온다 (개인정보: 도메인이 favicon 제공자에 전달됨).
function faviconUrl(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
    if (!u.hostname) return null
    return `https://icons.duckduckgo.com/ip3/${u.hostname}.ico`
  } catch {
    return null
  }
}

// 우선순위: 사용자가 고른 SVG 아이콘 > URL 파비콘 > 제목 첫 글자
export default function EntryAvatar({ entry, size = 38, className = '' }: Props): JSX.Element {
  const [imgError, setImgError] = useState(false)
  const glyph = entry.icon && ENTRY_ICON_MAP[entry.icon] ? entry.icon : null
  const fav = !glyph ? faviconUrl(entry.url) : null
  const showFav = !!fav && !imgError

  return (
    <div
      className={`entry-avatar ${className}`}
      style={{ width: size, height: size, background: showFav ? '#ffffff' : avatarColor(entry.title) }}
    >
      {glyph ? (
        <EntryGlyph id={glyph} size={Math.round(size * 0.56)} />
      ) : showFav ? (
        <img
          className="fav-img"
          src={fav as string}
          alt=""
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        initials(entry.title)
      )}
    </div>
  )
}
