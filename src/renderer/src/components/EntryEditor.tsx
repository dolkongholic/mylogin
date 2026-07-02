import { useState, type JSX } from 'react'
import { IconX, IconKey, IconEye, IconEyeOff, IconStar, IconStarOutline } from './icons'
import { generatePassword, passwordStrength, initials } from '../lib/utils'
import { ENTRY_ICONS, ENTRY_ICON_MAP, EntryGlyph } from './entryIcons'
import LabelSelect from './LabelSelect'
import type { EntryInput, LoginEntry } from '../../../shared/types'

interface Props {
  initial?: LoginEntry | null
  onClose: () => void
  onSave: (input: EntryInput) => Promise<void>
}

export default function EntryEditor({ initial, onClose, onSave }: Props): JSX.Element {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [username, setUsername] = useState(initial?.username ?? '')
  const [password, setPassword] = useState(initial?.password ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [labels, setLabels] = useState<string[]>(initial?.labels ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [favorite, setFavorite] = useState(initial?.favorite ?? false)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [genOpen, setGenOpen] = useState(false)
  const [genLen, setGenLen] = useState(16)
  const [genSym, setGenSym] = useState(true)

  const strength = passwordStrength(password)

  function doGenerate(): void {
    setPassword(
      generatePassword({ length: genLen, upper: true, lower: true, digits: true, symbols: genSym })
    )
    setShow(true)
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('제목을 입력하세요.')
    setBusy(true)
    try {
      await onSave({ title, username, password, url, labels, notes, icon, favorite })
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <form onSubmit={submit}>
          <div className="modal-head">
            <h2>{initial ? '항목 편집' : '새 항목'}</h2>
            <button type="button" className="icon-btn x" onClick={onClose}>
              <IconX size={18} />
            </button>
          </div>

          <div className="modal-body">
            <div className="field">
              <label>제목 *</label>
              <div className="row">
                <div className="icon-anchor">
                  <button
                    type="button"
                    className="icon-trigger"
                    onClick={() => setIconPickerOpen((v) => !v)}
                    title="아이콘 선택"
                  >
                    {icon && ENTRY_ICON_MAP[icon] ? (
                      <EntryGlyph id={icon} size={20} />
                    ) : (
                      <span className="icon-trigger-initial">{initials(title) || '?'}</span>
                    )}
                  </button>
                  {iconPickerOpen && (
                    <>
                      <div className="picker-backdrop" onClick={() => setIconPickerOpen(false)} />
                      <div className="icon-popover">
                        <button
                          type="button"
                          className={`icon-choice none ${!icon ? 'active' : ''}`}
                          onClick={() => {
                            setIcon('')
                            setIconPickerOpen(false)
                          }}
                          title="첫 글자 사용"
                        >
                          {initials(title) || '?'}
                        </button>
                        {ENTRY_ICONS.map((ic) => (
                          <button
                            type="button"
                            key={ic.id}
                            className={`icon-choice ${icon === ic.id ? 'active' : ''}`}
                            onClick={() => {
                              setIcon(ic.id)
                              setIconPickerOpen(false)
                            }}
                            title={ic.label}
                          >
                            <EntryGlyph id={ic.id} size={18} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <input
                  className="input"
                  value={title}
                  autoFocus
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: Google, GitHub, 회사 메일"
                />
                <button
                  type="button"
                  className="btn btn-icon"
                  title="즐겨찾기"
                  onClick={() => setFavorite((v) => !v)}
                  style={{ color: favorite ? 'var(--warning)' : undefined }}
                >
                  {favorite ? <IconStar size={18} /> : <IconStarOutline size={18} />}
                </button>
              </div>
            </div>

            <div className="field">
              <label>아이디 / 이메일</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="user@example.com"
                autoComplete="off"
              />
            </div>

            <div className="field">
              <label>비밀번호</label>
              <div className="row">
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    className="input"
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
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
                <button
                  type="button"
                  className="btn btn-icon"
                  title="비밀번호 생성"
                  onClick={() => setGenOpen((v) => !v)}
                >
                  <IconKey size={18} />
                </button>
              </div>
              {password && (
                <div className="strength">
                  <div
                    style={{
                      width: `${((strength.score + 1) / 5) * 100}%`,
                      background: strength.color
                    }}
                  />
                </div>
              )}

              {genOpen && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    background: 'var(--bg-input)',
                    borderRadius: 8,
                    border: '1px solid var(--border)'
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="muted" style={{ fontSize: 12.5 }}>
                      길이: {genLen}
                    </span>
                    <label className="row muted" style={{ fontSize: 12.5, gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={genSym}
                        onChange={(e) => setGenSym(e.target.checked)}
                      />
                      특수문자
                    </label>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={40}
                    value={genLen}
                    onChange={(e) => setGenLen(Number(e.target.value))}
                    style={{ width: '100%', margin: '8px 0' }}
                  />
                  <button type="button" className="btn btn-sm" onClick={doGenerate}>
                    <IconKey size={15} /> 생성하기
                  </button>
                </div>
              )}
            </div>

            <div className="field">
              <label>URL</label>
              <input
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
              />
            </div>

            <div className="field">
              <label>라벨 (여러 개 선택 가능)</label>
              <LabelSelect value={labels} onChange={setLabels} />
            </div>

            <div className="field" style={{ marginTop: 4, marginBottom: 0 }}>
              <label>메모</label>
              <textarea
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="추가 메모 (복구 코드 등)"
              />
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 12 }}>{error}</div>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn" onClick={onClose}>
              취소
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
