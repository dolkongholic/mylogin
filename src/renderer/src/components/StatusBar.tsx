import { useEffect, useState, type JSX } from 'react'

export default function StatusBar(): JSX.Element {
  const [version, setVersion] = useState('')
  useEffect(() => {
    window.api.appVersion().then(setVersion)
  }, [])

  return (
    <div className="statusbar">
      <span className="status-left">v{version || '0.0.0'}</span>
      <span className="status-right">MangoSpanner</span>
    </div>
  )
}
