import { useEffect, useState, type JSX } from 'react'

interface Props {
  onCheckUpdate: () => void
  onShowNotes: () => void
}

export default function StatusBar({ onCheckUpdate, onShowNotes }: Props): JSX.Element {
  const [version, setVersion] = useState('')
  useEffect(() => {
    window.api.appVersion().then(setVersion)
  }, [])

  return (
    <div className="statusbar">
      <div className="status-left">
        <span>v{version || '0.0.0'}</span>
        <button className="status-link" onClick={onCheckUpdate}>
          업데이트 확인
        </button>
        <button className="status-link" onClick={onShowNotes}>
          기록
        </button>
      </div>
      <span className="status-right">© 2026. NTPERCENT</span>
    </div>
  )
}
