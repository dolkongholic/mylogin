import { useEffect, useState, type JSX } from 'react'
import { IconX, IconUpload, IconDownload, IconTrash, IconRefresh, IconCloud, IconShare } from './icons'
import { toast } from '../lib/toast'
import { confirm } from '../lib/confirm'
import { timeAgo } from '../lib/utils'
import type { ApiResult, SyncSummary } from '../../../shared/types'

interface Props {
  onClose: () => void
  onChanged: () => void // 로컬 항목이 바뀌었을 수 있음 (pull) → 새로고침
}

export default function SyncPanel({ onClose, onChanged }: Props): JSX.Element {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [summary, setSummary] = useState<SyncSummary | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function init(): Promise<void> {
    const isConf = await window.api.syncConfigured()
    setConfigured(isConf)
    if (isConf) await refresh()
  }

  async function refresh(): Promise<void> {
    const res = await window.api.syncStatus()
    if (res.ok && res.data) setSummary(res.data)
  }

  function handle(res: ApiResult<SyncSummary>, okMsg: string): void {
    if (res.ok) {
      if (res.data) setSummary(res.data)
      toast(okMsg, 'success')
      onChanged()
    } else {
      toast(res.error ?? '오류', 'error')
    }
  }

  async function run(fn: () => Promise<ApiResult<SyncSummary>>, msg: string): Promise<void> {
    setBusy(true)
    const res = await fn()
    setBusy(false)
    handle(res, msg)
  }

  const signedIn = summary?.signedIn

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal wide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="row" style={{ gap: 9 }}>
            <IconCloud size={20} /> 서버 동기화
          </h2>
          <button className="icon-btn x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* 서버 연결 불가 (정상 빌드에선 발생하지 않음) */}
          {configured === false && (
            <div className="muted" style={{ fontSize: 13, padding: '8px 0 16px' }}>
              동기화 서버에 연결할 수 없습니다. 앱을 다시 설치하거나 관리자에게 문의하세요.
            </div>
          )}

          {/* 계정 로그인 */}
          {configured && !signedIn && (
            <div>
              <div className="section-label">mangomail 계정 로그인</div>
              <div className="field">
                <label>이메일 (mangomail과 동일 계정)</label>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="field">
                <label>비밀번호 (계정용 — 마스터 비번과 별개)</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="row">
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => run(() => window.api.syncSignIn(email, password), '로그인됨')}
                >
                  로그인
                </button>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    run(() => window.api.syncSignUp(email, password), '가입 완료 (메일 확인 필요할 수 있음)')
                  }
                >
                  회원가입
                </button>
              </div>
            </div>
          )}

          {/* 3) 동기화 작업 */}
          {signedIn && (
            <div>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{summary?.email}</div>
                  <div className="faint" style={{ fontSize: 12 }}>
                    {summary?.lastSyncedAt
                      ? `마지막 동기화 ${timeAgo(summary.lastSyncedAt)}`
                      : '아직 동기화 안 함'}
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => run(() => window.api.syncSignOut().then(() => window.api.syncStatus()), '로그아웃됨')}
                >
                  로그아웃
                </button>
              </div>

              <div className="row" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busy}
                  onClick={() => run(() => window.api.syncPushAll(), '전체 업로드 완료')}
                >
                  <IconUpload size={15} /> 전체 업로드
                </button>
                <button
                  className="btn btn-sm"
                  disabled={busy}
                  onClick={() => run(() => window.api.syncPull(), '서버에서 가져옴')}
                >
                  <IconDownload size={15} /> 가져오기
                </button>
                <button
                  className="btn btn-sm"
                  disabled={busy}
                  onClick={() => run(() => window.api.syncStatus(), '새로고침됨')}
                >
                  <IconRefresh size={15} /> 새로고침
                </button>
                <button
                  className="btn btn-sm"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    const res = await window.api.shareList()
                    setBusy(false)
                    if (res.ok && res.data) {
                      const d = res.data
                      const extra = d.receivedFailed > 0 ? ` · 복호화 실패 ${d.receivedFailed}개` : ''
                      toast(
                        `받은 공유 ${d.received.length}개 · 내가 공유 ${d.made.length}개${extra}`,
                        d.receivedFailed > 0 ? 'error' : 'success'
                      )
                      onChanged()
                    } else {
                      toast(res.error ?? '공유 불러오기 실패', 'error')
                    }
                  }}
                >
                  <IconShare size={15} /> 받은 공유
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ marginLeft: 'auto' }}
                  disabled={busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: '서버 전체 삭제',
                      message: '서버의 모든 항목을 삭제할까요? 로컬 금고는 그대로 유지됩니다.',
                      confirmText: '전체 삭제',
                      danger: true
                    })
                    if (ok) run(() => window.api.syncDeleteAllRemote(), '서버 전체 삭제됨')
                  }}
                >
                  <IconTrash size={15} /> 서버 전체 삭제
                </button>
              </div>

              <div className="section-label">항목 상태 ({summary?.items.length ?? 0})</div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {summary?.items.length === 0 && (
                  <div className="muted" style={{ fontSize: 13, padding: '8px 0' }}>
                    항목이 없습니다.
                  </div>
                )}
                {summary?.items.map((it) => (
                  <div key={it.id} className="sync-item">
                    <span style={{ flex: 1, fontSize: 13.5 }}>{it.title}</span>
                    <span className={`badge ${it.state}`}>
                      {it.state === 'synced'
                        ? '동기화됨'
                        : it.state === 'local-only'
                          ? '로컬만'
                          : it.state === 'remote-only'
                            ? '서버만'
                            : '충돌'}
                    </span>
                    {it.state === 'local-only' || it.state === 'conflict' ? (
                      <button
                        className="icon-btn"
                        title="이 항목 업로드"
                        onClick={() => run(() => window.api.syncPushOne(it.id), '업로드됨')}
                      >
                        <IconUpload size={15} />
                      </button>
                    ) : null}
                    <button
                      className="icon-btn"
                      title="서버에서 삭제"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => run(() => window.api.syncDeleteRemote(it.id), '서버에서 삭제됨')}
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
