import { useState, type JSX } from 'react'
import { IconPlus, IconX } from './icons'
import { getLabels, addLabel } from '../lib/labels'

interface Props {
  value: string[]
  onChange: (v: string[]) => void
}

// 라벨 다중 선택: 목록에서 토글 + 새 라벨 추가.
export default function LabelSelect({ value, onChange }: Props): JSX.Element {
  const [labels, setLabels] = useState<string[]>(() => {
    // 항목이 이미 가진 라벨도 목록에 포함
    const base = getLabels()
    const extra = value.filter((v) => !base.includes(v))
    return [...base, ...extra]
  })
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  function toggle(name: string): void {
    onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name])
  }

  function commitAdd(): void {
    const n = newName.trim()
    if (n) {
      setLabels(addLabel(n))
      if (!value.includes(n)) onChange([...value, n])
    }
    setNewName('')
    setAdding(false)
  }

  return (
    <div className="label-picker">
      <div className="label-chips">
        {labels.map((name) => {
          const on = value.includes(name)
          return (
            <button
              type="button"
              key={name}
              className={`label-chip ${on ? 'on' : ''}`}
              onClick={() => toggle(name)}
            >
              {name}
            </button>
          )
        })}
        {!adding && (
          <button
            type="button"
            className="label-chip add"
            title="새 라벨"
            onClick={() => setAdding(true)}
          >
            <IconPlus size={13} />
          </button>
        )}
      </div>
      {adding && (
        <div className="row" style={{ gap: 6, marginTop: 8 }}>
          <input
            className="input"
            value={newName}
            autoFocus
            placeholder="새 라벨 이름"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitAdd()
              } else if (e.key === 'Escape') {
                setAdding(false)
                setNewName('')
              }
            }}
          />
          <button type="button" className="btn btn-icon btn-primary" onClick={commitAdd}>
            <IconPlus size={16} />
          </button>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => {
              setAdding(false)
              setNewName('')
            }}
          >
            <IconX size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
