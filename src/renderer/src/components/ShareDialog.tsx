import { useEffect, useState, type JSX } from 'react'
import { IconX, IconTrash, IconShare } from './icons'
import { toast } from '../lib/toast'
import type { LoginEntry, ShareMade, SharePermission } from '../../../shared/types'

interface Props {
  entry: LoginEntry
  onClose: () => void
  onShared: () => void
}

export default function ShareDialog({ entry, onClose, onShared }: Props): JSX.Element {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<SharePermission>('read')
  const [recipients, setRecipients] = useState<ShareMade[]>([])
  const [recentEmails, setRecentEmails] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  async function reload(): Promise<void> {
    const res = await window.api.shareList()
    if (res.ok && res.data) {
      const mine = res.data.made
      setRecipients(mine.filter((m) => m.itemId === entry.id))
      // 최근 공유한 이메일(모든 항목 기준) 모음
      setRecentEmails(Array.from(new Set(mine.map((m) => m.recipientEmail))))
    }
    setLoading(false)
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add(targetEmail?: string, perm?: SharePermission): Promise<void> {
    const e = (targetEmail ?? email).trim().toLowerCase()
    if (!e) return toast('공유할 상대 이메일을 입력하세요.', 'error')
    setBusy(true)
    const res = await window.api.shareCreate(entry.id, e, perm ?? permission)
    setBusy(false)
    if (res.ok) {
      toast(`${e} 님에게 공유했습니다.`, 'success')
      setEmail('')
      await reload()
      onShared()
    } else {
      toast(res.error ?? '공유 실패', 'error')
    }
  }

  // 기존 공유의 권한 변경 (재공유 upsert)
  async function changePermission(r: ShareMade, perm: SharePermission): Promise<void> {
    if (r.permission === perm) return
    setBusy(true)
    const res = await window.api.shareCreate(entry.id, r.recipientEmail, perm)
    setBusy(false)
    if (res.ok) {
      toast(`${r.recipientEmail} 권한을 ${perm === 'edit' ? '수정 가능' : '보기'}로 변경`, 'success')
      await reload()
      onShared()
    } else {
      toast(res.error ?? '권한 변경 실패', 'error')
    }
  }

  async function remove(shareId: string, who: string): Promise<void> {
    const res = await window.api.shareDelete(shareId)
    if (res.ok) {
      toast(`${who} 공유를 해제했습니다.`, 'success')
      await reload()
      onShared()
    } else {
      toast(res.error ?? '해제 실패', 'error')
    }
  }

  const currentEmails = new Set(recipients.map((r) => r.recipientEmail))
  const suggestions = recentEmails.filter((e) => !currentEmails.has(e))

  return (
    <div className="overlay" style={{ zIndex: 75 }} onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="row" style={{ gap: 8 }}>
            <IconShare size={18} /> 공유 · {entry.title}
          </h2>
          <button className="icon-btn x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>상대 이메일 (mangomail 계정)</label>
            <div className="row" style={{ gap: 6 }}>
              <input
                className="input"
                value={email}
                placeholder="friend@example.com"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void add()
                  }
                }}
              />
              <select
                className="input select"
                style={{ width: 110, flexShrink: 0 }}
                value={permission}
                onChange={(e) => setPermission(e.target.value as SharePermission)}
              >
                <option value="read">보기</option>
                <option value="edit">수정 가능</option>
              </select>
            </div>

            {suggestions.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="faint" style={{ fontSize: 11, marginBottom: 5 }}>
                  최근 공유한 사람
                </div>
                <div className="label-chips">
                  {suggestions.slice(0, 8).map((e) => (
                    <button
                      type="button"
                      key={e}
                      className="label-chip"
                      title="클릭하면 이메일 입력"
                      onClick={() => setEmail(e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ marginTop: 10, width: '100%' }}
              onClick={() => add()}
              disabled={busy}
            >
              <IconShare size={15} /> 공유하기
            </button>
          </div>

          <div className="section-label" style={{ marginTop: 6 }}>
            공유 중인 사람 {recipients.length > 0 ? `(${recipients.length})` : ''}
          </div>
          {loading ? (
            <div className="muted" style={{ fontSize: 13 }}>
              불러오는 중…
            </div>
          ) : recipients.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>
              아직 공유한 사람이 없습니다.
            </div>
          ) : (
            recipients.map((r) => (
              <div key={r.shareId} className="sync-item">
                <span style={{ flex: 1, fontSize: 13.5, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.recipientEmail}
                </span>
                <select
                  className="input select"
                  style={{ width: 104, flexShrink: 0, padding: '5px 26px 5px 9px', fontSize: 12.5 }}
                  value={r.permission}
                  disabled={busy}
                  onChange={(e) => changePermission(r, e.target.value as SharePermission)}
                >
                  <option value="read">보기</option>
                  <option value="edit">수정 가능</option>
                </select>
                <button
                  className="icon-btn"
                  title="공유 해제"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => remove(r.shareId, r.recipientEmail)}
                >
                  <IconTrash size={15} />
                </button>
              </div>
            ))
          )}

          <div className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
            항목은 상대의 공개키로 암호화되어 전달됩니다. 서버도 내용을 볼 수 없어요(E2E).
          </div>
        </div>
      </div>
    </div>
  )
}
