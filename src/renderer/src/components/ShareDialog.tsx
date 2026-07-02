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
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  async function reload(): Promise<void> {
    const res = await window.api.shareList()
    if (res.ok && res.data) {
      setRecipients(res.data.made.filter((m) => m.itemId === entry.id))
    }
    setLoading(false)
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add(): Promise<void> {
    const e = email.trim().toLowerCase()
    if (!e) return toast('공유할 상대 이메일을 입력하세요.', 'error')
    setBusy(true)
    const res = await window.api.shareCreate(entry.id, e, permission)
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
            <button
              className="btn btn-primary"
              style={{ marginTop: 10, width: '100%' }}
              onClick={add}
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
                <span style={{ flex: 1, fontSize: 13.5 }}>{r.recipientEmail}</span>
                <span className={`badge ${r.permission === 'edit' ? 'local-only' : 'synced'}`}>
                  {r.permission === 'edit' ? '수정 가능' : '보기'}
                </span>
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
            상대는 “공유받음” 라벨로 이 항목을 보게 됩니다.
          </div>
        </div>
      </div>
    </div>
  )
}
