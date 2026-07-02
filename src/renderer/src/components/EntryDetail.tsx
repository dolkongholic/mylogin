import { useState, type JSX } from 'react'
import {
  IconX,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconEdit,
  IconTrash,
  IconExternal,
  IconStar,
  IconShare
} from './icons'
import EntryAvatar from './EntryAvatar'
import { copyText, timeAgo } from '../lib/utils'
import { toast } from '../lib/toast'
import type { LoginEntry } from '../../../shared/types'

interface Props {
  entry: LoginEntry
  onClose: () => void
  onEdit: (e: LoginEntry) => void
  onDelete: (e: LoginEntry) => void
  onShare: (e: LoginEntry) => void
}

export default function EntryDetail({ entry, onClose, onEdit, onDelete, onShare }: Props): JSX.Element {
  const shared = entry.shared
  const canEdit = !shared || shared.permission === 'edit'
  const [reveal, setReveal] = useState(false)

  async function copy(text: string, label: string): Promise<void> {
    if (!text) return toast(`${label}이(가) 비어 있습니다.`, 'error')
    await copyText(text)
    toast(`${label} 복사됨`, 'success')
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="row" style={{ gap: 12, minWidth: 0 }}>
            <EntryAvatar entry={entry} size={40} />
            <div style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 6 }}>
                <h2 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.title}
                </h2>
                {entry.favorite && (
                  <span style={{ color: 'var(--warning)' }}>
                    <IconStar size={15} />
                  </span>
                )}
              </div>
              {entry.labels && entry.labels.length > 0 && (
                <div className="label-chips" style={{ marginTop: 5 }}>
                  {entry.labels.map((l) => (
                    <span key={l} className="cat-chip">
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className="icon-btn x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className="modal-body">
          {shared && (
            <div className="shared-banner">
              <IconShare size={15} />
              <span>
                <b>{shared.ownerEmail}</b> 님이 공유 ·{' '}
                {shared.permission === 'edit' ? '수정 가능' : '보기 전용'}
              </span>
            </div>
          )}
          {/* 아이디 */}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>아이디 / 이메일</label>
            <div className="detail-row">
              <span className="detail-val">{entry.username || '(없음)'}</span>
              <button
                className="icon-btn"
                title="아이디 복사"
                onClick={() => copy(entry.username, '아이디')}
              >
                <IconCopy size={16} />
              </button>
            </div>
          </div>

          {/* 비밀번호 */}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>비밀번호</label>
            <div className="detail-row">
              <span className="detail-val mono">
                {reveal ? entry.password || '(없음)' : '••••••••••••'}
              </span>
              <button className="icon-btn" title="표시/숨김" onClick={() => setReveal((v) => !v)}>
                {reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
              <button
                className="icon-btn"
                title="비밀번호 복사"
                onClick={() => copy(entry.password, '비밀번호')}
              >
                <IconCopy size={16} />
              </button>
            </div>
          </div>

          {/* URL */}
          {entry.url && (
            <div className="field" style={{ marginBottom: 12 }}>
              <label>URL</label>
              <div className="detail-row">
                <span className="detail-val" style={{ color: 'var(--primary)' }}>
                  {entry.url}
                </span>
                <button
                  className="icon-btn"
                  title="링크 열기"
                  onClick={() => window.open(entry.url, '_blank')}
                >
                  <IconExternal size={16} />
                </button>
                <button className="icon-btn" title="URL 복사" onClick={() => copy(entry.url!, 'URL')}>
                  <IconCopy size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 메모 */}
          {entry.notes && (
            <div className="field" style={{ marginBottom: 12 }}>
              <label>메모</label>
              <div className="detail-note">{entry.notes}</div>
            </div>
          )}

          <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>
            수정 {timeAgo(entry.updatedAt)} · 생성 {timeAgo(entry.createdAt)}
          </div>
        </div>

        <div className="modal-foot">
          <button
            className="btn btn-danger"
            style={{ marginRight: 'auto' }}
            onClick={() => onDelete(entry)}
          >
            <IconTrash size={16} /> {shared ? '공유 나가기' : '삭제'}
          </button>
          {!shared && (
            <button className="btn" onClick={() => onShare(entry)}>
              <IconShare size={16} /> 공유
            </button>
          )}
          <button className="btn" onClick={onClose}>
            닫기
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => onEdit(entry)}>
              <IconEdit size={16} /> 수정
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
