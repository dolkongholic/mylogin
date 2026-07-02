import { useEffect, useState, type JSX } from 'react'
import { IconX, IconRefresh } from './icons'
import { toast } from '../lib/toast'
import { useAutoLock, setAutoLock, AUTOLOCK_OPTIONS } from '../lib/autolock'

interface Props {
  onClose: () => void
  onShowNotes: () => void
}

export default function SettingsPanel({ onClose, onShowNotes }: Props): JSX.Element {
  const [version, setVersion] = useState('')
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')
  const autoLock = useAutoLock()

  useEffect(() => {
    window.api.appVersion().then(setVersion)
  }, [])

  async function changeMaster(): Promise<void> {
    if (next.length < 4) return toast('새 비밀번호는 4자 이상이어야 합니다.', 'error')
    if (next !== confirm) return toast('새 비밀번호가 일치하지 않습니다.', 'error')
    setBusy(true)
    const res = await window.api.changeMasterPassword(cur, next)
    setBusy(false)
    if (res.ok) {
      toast('마스터 비밀번호가 변경되었습니다.', 'success')
      setCur('')
      setNext('')
      setConfirm('')
    } else {
      toast(res.error ?? '변경 실패', 'error')
    }
  }

  async function checkUpdate(): Promise<void> {
    setUpdateMsg('확인 중…')
    const res = await window.api.checkForUpdates()
    setUpdateMsg(res.ok ? (res.data ?? '확인 완료') : (res.error ?? '확인 실패'))
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>설정</h2>
          <button className="icon-btn x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="section-label">보안 · 자동 잠금</div>
          <div className="field">
            <label>미사용 시 자동 잠금</label>
            <select
              className="input select"
              value={autoLock}
              onChange={(e) => setAutoLock(Number(e.target.value))}
            >
              {AUTOLOCK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>
              마우스·키보드 입력이 선택한 시간 동안 없으면 자동으로 잠깁니다.
            </div>
          </div>

          <div className="divider" />

          <div className="section-label">마스터 비밀번호 변경</div>
          <div className="field">
            <label>현재 비밀번호</label>
            <input
              className="input"
              type="password"
              value={cur}
              onChange={(e) => setCur(e.target.value)}
            />
          </div>
          <div className="field">
            <label>새 비밀번호</label>
            <input
              className="input"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="field">
            <label>새 비밀번호 확인</label>
            <input
              className="input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={changeMaster} disabled={busy || !cur}>
            비밀번호 변경
          </button>

          <div className="divider" />

          <div className="section-label">앱 정보</div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">버전</span>
            <span>v{version}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
            <span className="muted">{updateMsg || '업데이트를 확인할 수 있습니다.'}</span>
            <button className="btn btn-sm" onClick={checkUpdate}>
              <IconRefresh size={15} /> 업데이트 확인
            </button>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
            <span className="muted">이번 버전의 새로운 기능</span>
            <button className="btn btn-sm" onClick={onShowNotes}>
              패치 내용 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
