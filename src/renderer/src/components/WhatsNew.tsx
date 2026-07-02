import type { JSX } from 'react'
import { IconX, IconCheck } from './icons'
import { notesFor } from '../lib/releaseNotes'

interface Props {
  version: string
  onClose: () => void
}

// 업데이트 후 처음 실행 시 뜨는 "패치 내용" 모달
export default function WhatsNew({ version, onClose }: Props): JSX.Element | null {
  const note = notesFor(version)
  if (!note) return null
  return (
    <div className="overlay" style={{ zIndex: 70 }} onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="row" style={{ gap: 8 }}>
            <span className="whatsnew-badge">NEW</span> 업데이트되었습니다
          </h2>
          <button className="icon-btn x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{note.title}</div>
          <ul className="whatsnew-list">
            {note.items.map((it, i) => (
              <li key={i}>
                <span className="wn-check">
                  <IconCheck size={14} />
                </span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
