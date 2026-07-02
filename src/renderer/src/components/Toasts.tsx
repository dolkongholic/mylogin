import type { JSX } from 'react'
import { useToasts } from '../lib/toast'
import { IconCheck, IconAlert, IconCopy } from './icons'

function icon(kind: string): JSX.Element {
  if (kind === 'success') return <IconCheck size={17} />
  if (kind === 'error') return <IconAlert size={17} />
  return <IconCopy size={17} />
}

export default function Toasts(): JSX.Element {
  const toasts = useToasts()
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          <span className="toast-icon">{icon(t.kind)}</span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
