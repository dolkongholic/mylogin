import { useState, type JSX } from 'react'
import { IconLock, IconEye, IconEyeOff } from './icons'
import { passwordStrength } from '../lib/utils'
import type { VaultStatus } from '../../../shared/types'

interface Props {
  isNew: boolean // 볼트가 아직 없으면 true (최초 마스터 비번 설정)
  onUnlocked: (status: VaultStatus) => void
}

export default function UnlockScreen({ isNew, onUnlocked }: Props): JSX.Element {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const strength = passwordStrength(pw)

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError('')
    if (isNew) {
      if (pw.length < 4) return setError('마스터 비밀번호는 4자 이상이어야 합니다.')
      if (pw !== confirm) return setError('비밀번호가 일치하지 않습니다.')
    }
    setBusy(true)
    const res = isNew ? await window.api.create(pw) : await window.api.unlock(pw)
    setBusy(false)
    if (res.ok && res.data) {
      onUnlocked(res.data)
    } else {
      setError(res.error ?? '오류가 발생했습니다.')
    }
  }

  return (
    <div className="lock-screen">
      <form className="lock-card" onSubmit={submit}>
        <div className="lock-logo">
          <IconLock size={26} />
        </div>
        <div className="lock-title">{isNew ? 'myLogin 시작하기' : '잠금 해제'}</div>
        <div className="lock-sub">
          {isNew
            ? '볼트를 보호할 마스터 비밀번호를 설정하세요.\n이 비밀번호는 복구할 수 없으니 꼭 기억하세요.'
            : '마스터 비밀번호를 입력해 볼트를 여세요.'}
        </div>

        <div className="field">
          <label>마스터 비밀번호</label>
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type={show ? 'text' : 'password'}
              value={pw}
              autoFocus
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShow((v) => !v)}
              style={{ position: 'absolute', right: 6, top: 7 }}
              tabIndex={-1}
            >
              {show ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
          {isNew && pw && (
            <>
              <div className="strength">
                <div
                  style={{
                    width: `${((strength.score + 1) / 5) * 100}%`,
                    background: strength.color
                  }}
                />
              </div>
              <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>
                강도: {strength.label}
              </div>
            </>
          )}
        </div>

        {isNew && (
          <div className="field">
            <label>마스터 비밀번호 확인</label>
            <input
              className="input"
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 12 }}>{error}</div>
        )}

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy || !pw}>
          {busy ? '처리 중…' : isNew ? '볼트 만들기' : '잠금 해제'}
        </button>
      </form>
    </div>
  )
}
