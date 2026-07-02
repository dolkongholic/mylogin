import { useEffect, type JSX } from 'react'
import { useConfirm, resolveConfirm } from '../lib/confirm'
import { IconAlert } from './icons'

// 앱 컨셉에 맞춘 커스텀 확인 모달 (네이티브 confirm 대체)
export default function ConfirmDialog(): JSX.Element | null {
  const state = useConfirm()

  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') resolveConfirm(false)
      else if (e.key === 'Enter') resolveConfirm(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state])

  if (!state) return null

  return (
    <div className="overlay" style={{ zIndex: 80 }} onMouseDown={() => resolveConfirm(false)}>
      <div className="modal confirm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="confirm-body">
          <div className={`confirm-icon ${state.danger ? 'danger' : ''}`}>
            <IconAlert size={22} />
          </div>
          <h2 className="confirm-title">{state.title}</h2>
          <p className="confirm-msg">{state.message}</p>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => resolveConfirm(false)}>
            {state.cancelText ?? '취소'}
          </button>
          <button
            className={`btn ${state.danger ? 'btn-danger-solid' : 'btn-primary'}`}
            onClick={() => resolveConfirm(true)}
            autoFocus
          >
            {state.confirmText ?? '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}
