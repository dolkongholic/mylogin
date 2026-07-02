import { useCallback, useEffect, useMemo, useState, type JSX } from 'react'
import UnlockScreen from './components/UnlockScreen'
import EntryCard, { type DndHandlers } from './components/EntryCard'
import EntryEditor from './components/EntryEditor'
import EntryDetail from './components/EntryDetail'
import SyncPanel from './components/SyncPanel'
import SettingsPanel from './components/SettingsPanel'
import Toasts from './components/Toasts'
import ConfirmDialog from './components/ConfirmDialog'
import WhatsNew from './components/WhatsNew'
import TitleBar from './components/TitleBar'
import StatusBar from './components/StatusBar'
import {
  IconPlus,
  IconSearch,
  IconLock,
  IconCloud,
  IconSettings,
  IconStar,
  IconKey,
  IconSun,
  IconMoon,
  IconChevronLeft,
  IconChevronRight,
  IconFolder,
  IconTag,
  IconGrid,
  IconList
} from './components/icons'
import { toast } from './lib/toast'
import { confirm } from './lib/confirm'
import { useTheme } from './lib/theme'
import { useZoom } from './lib/zoom'
import { getOrder, saveOrder, sortByOrder } from './lib/order'
import { useAutoLock } from './lib/autolock'
import { isFreshUpdate, markVersionSeen } from './lib/releaseNotes'
import type { EntryInput, LoginEntry, UpdateEvent, VaultStatus } from '../../shared/types'

// 'all' | 'fav' | 'uncat' | `cat:<이름>`
type View = string

export default function App(): JSX.Element {
  const [status, setStatus] = useState<VaultStatus | null>(null)
  const [entries, setEntries] = useState<LoginEntry[]>([])
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>('all')
  const [viewing, setViewing] = useState<LoginEntry | null>(null)
  const [editing, setEditing] = useState<LoginEntry | null | undefined>(undefined)
  const [showSync, setShowSync] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [update, setUpdate] = useState<UpdateEvent | null>(null)
  const [whatsNewVersion, setWhatsNewVersion] = useState<string | null>(null)
  const [theme, toggleTheme] = useTheme()
  const zoom = useZoom()
  const autoLockMin = useAutoLock()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('mylogin-sidebar') === 'collapsed'
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    () => (localStorage.getItem('mylogin-viewmode') === 'list' ? 'list' : 'grid')
  )
  const [order, setOrder] = useState<string[]>(getOrder)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [overBelow, setOverBelow] = useState(false)

  useEffect(() => {
    localStorage.setItem('mylogin-sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => {
    localStorage.setItem('mylogin-viewmode', viewMode)
  }, [viewMode])

  useEffect(() => {
    window.api.getStatus().then(setStatus)
    // 업데이트되어 처음 실행됐으면 패치 내용 표시
    window.api.appVersion().then((v) => {
      if (isFreshUpdate(v)) {
        setWhatsNewVersion(v)
        toast('앱이 최신 버전으로 패치되었습니다.', 'success')
      }
      markVersionSeen(v)
    })
    const off = window.api.onUpdateEvent((evt) => {
      setUpdate(evt)
      if (evt.type === 'error') toast(`업데이트 오류: ${evt.message}`, 'error')
      if (evt.type === 'downloaded') {
        void confirm({
          title: '업데이트 준비 완료',
          message: `새 버전 ${evt.version ?? ''}을(를) 지금 적용할까요? 앱이 재시작됩니다.`,
          confirmText: '재시작하여 적용',
          cancelText: '나중에'
        }).then((ok) => {
          if (ok) window.api.restartToUpdate()
        })
      }
    })
    return off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadEntries = useCallback(async (): Promise<void> => {
    const res = await window.api.listEntries()
    if (res.ok && res.data) setEntries(res.data)
  }, [])

  useEffect(() => {
    if (status?.unlocked) void loadEntries()
  }, [status?.unlocked, loadEntries])

  const lock = useCallback(async (): Promise<void> => {
    await window.api.lock()
    setEntries([])
    setStatus((s) => (s ? { ...s, unlocked: false } : s))
  }, [])

  // 자동 잠금: 설정된 시간 동안 활동이 없으면 잠금
  useEffect(() => {
    if (!status?.unlocked || !autoLockMin) return
    let timer: ReturnType<typeof setTimeout>
    const reset = (): void => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        void lock()
        toast('일정 시간 미사용으로 잠겼습니다.', 'info')
      }, autoLockMin * 60 * 1000)
    }
    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'wheel',
      'touchstart'
    ]
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [status?.unlocked, autoLockMin, lock])

  async function saveEntry(input: EntryInput): Promise<void> {
    const res =
      editing && editing.id
        ? await window.api.updateEntry(editing.id, input)
        : await window.api.addEntry(input)
    if (res.ok) {
      setEditing(undefined)
      await loadEntries()
      toast(editing?.id ? '항목이 수정되었습니다.' : '항목이 추가되었습니다.', 'success')
    } else {
      throw new Error(res.error)
    }
  }

  async function deleteEntry(entry: LoginEntry): Promise<boolean> {
    const ok = await confirm({
      title: '항목 삭제',
      message: `"${entry.title}" 항목을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      danger: true
    })
    if (!ok) return false
    const res = await window.api.deleteEntry(entry.id)
    if (res.ok) {
      await loadEntries()
      toast('항목이 삭제되었습니다.', 'success')
      return true
    }
    toast(res.error ?? '삭제 실패', 'error')
    return false
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesView = (e: LoginEntry): boolean => {
      if (view === 'all') return true
      if (view === 'fav') return !!e.favorite
      if (view === 'uncat') return !(e.labels && e.labels.length > 0)
      if (view.startsWith('label:')) return !!e.labels?.includes(view.slice(6))
      return true
    }
    const subset = entries
      .filter(matchesView)
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          (e.url ?? '').toLowerCase().includes(q) ||
          (e.labels ?? []).some((l) => l.toLowerCase().includes(q))
      )
    return sortByOrder(subset, order)
  }, [entries, query, view, order])

  const favCount = entries.filter((e) => e.favorite).length

  // 항목들의 라벨을 자동 집계 (이름 → 개수). 한 항목이 여러 라벨에 속할 수 있음.
  const labelList = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of entries) {
      for (const l of e.labels ?? []) map.set(l, (map.get(l) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ko'))
  }, [entries])
  const unlabeledCount = entries.filter((e) => !(e.labels && e.labels.length > 0)).length

  // 드래그 정렬 (리스트 보기)
  const dnd: DndHandlers = {
    dragId,
    overId,
    overBelow,
    onStart: setDragId,
    onOver: (id, below) => {
      setOverId(id)
      setOverBelow(below)
    },
    onDrop: (targetId, below) => {
      if (dragId && dragId !== targetId) {
        const ids = sortByOrder(entries, order).map((e) => e.id)
        const from = ids.indexOf(dragId)
        if (from >= 0) ids.splice(from, 1)
        let to = ids.indexOf(targetId)
        if (to < 0) to = ids.length
        if (below) to += 1
        ids.splice(to, 0, dragId)
        setOrder(ids)
        saveOrder(ids)
      }
      setDragId(null)
      setOverId(null)
    },
    onEnd: () => {
      setDragId(null)
      setOverId(null)
    }
  }

  // ── 로딩 ──
  if (!status) {
    return (
      <div className="window">
        <TitleBar />
        <div style={{ flex: 1 }} />
        <StatusBar />
      </div>
    )
  }

  // ── 잠금 화면 ──
  if (!status.unlocked) {
    return (
      <div className="window">
        <TitleBar />
        <UnlockScreen isNew={!status.exists} onUnlocked={setStatus} />
        <StatusBar />
        <Toasts />
        <ConfirmDialog />
        {whatsNewVersion && (
          <WhatsNew version={whatsNewVersion} onClose={() => setWhatsNewVersion(null)} />
        )}
      </div>
    )
  }

  // ── 메인 ──
  return (
    <div className="window">
      <TitleBar />
      <div className="app" style={{ zoom }}>
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="brand">
            <span className="dot">
              <IconLock size={15} />
            </span>
            <span className="nav-label">MangoLogin</span>
            <button
              className="collapse-btn"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            >
              {collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
            </button>
          </div>

          <button
            className={`nav-item ${view === 'all' ? 'active' : ''}`}
            onClick={() => setView('all')}
            title="모든 항목"
          >
            <IconKey size={17} />
            <span className="nav-label">모든 항목</span>
            <span className="count">{entries.length}</span>
          </button>
          <button
            className={`nav-item ${view === 'fav' ? 'active' : ''}`}
            onClick={() => setView('fav')}
            title="즐겨찾기"
          >
            <IconStar size={17} />
            <span className="nav-label">즐겨찾기</span>
            <span className="count">{favCount}</span>
          </button>

          {(labelList.length > 0 || unlabeledCount > 0) && (
            <div className="cat-section">
              <div className="section-label nav-label">라벨</div>
              {labelList.map(([name, n]) => (
                <button
                  key={name}
                  className={`nav-item ${view === `label:${name}` ? 'active' : ''}`}
                  onClick={() => setView(`label:${name}`)}
                  title={name}
                >
                  <IconFolder size={17} />
                  <span className="nav-label">{name}</span>
                  <span className="count">{n}</span>
                </button>
              ))}
              {unlabeledCount > 0 && (
                <button
                  className={`nav-item ${view === 'uncat' ? 'active' : ''}`}
                  onClick={() => setView('uncat')}
                  title="라벨 없음"
                >
                  <IconTag size={17} />
                  <span className="nav-label">라벨 없음</span>
                  <span className="count">{unlabeledCount}</span>
                </button>
              )}
            </div>
          )}

          <div className="divider" />

          <button className="nav-item" onClick={() => setShowSync(true)} title="서버 동기화">
            <IconCloud size={17} />
            <span className="nav-label">서버 동기화</span>
          </button>
          <button className="nav-item" onClick={() => setShowSettings(true)} title="설정">
            <IconSettings size={17} />
            <span className="nav-label">설정</span>
          </button>

          <div className="sidebar-foot">
            <button className="nav-item" onClick={toggleTheme} title="테마 전환">
              {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
              <span className="nav-label">{theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
            </button>
            <button className="nav-item" onClick={lock} title="잠그기">
              <IconLock size={17} />
              <span className="nav-label">잠그기</span>
            </button>
          </div>
        </aside>

        <main className="main">
          {update &&
            (update.type === 'downloaded' ||
              update.type === 'available' ||
              update.type === 'downloading') && (
              <div className="update-banner">
                <IconCloud size={17} />
                <span style={{ flex: 1 }}>
                  {update.message}
                  {update.type === 'downloading' && update.percent != null
                    ? ` (${update.percent}%)`
                    : ''}
                </span>
                {update.type === 'downloaded' && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => window.api.restartToUpdate()}
                  >
                    재시작하여 업데이트
                  </button>
                )}
              </div>
            )}

          <div className="topbar">
            <div className="search">
              <span className="ico">
                <IconSearch size={17} />
              </span>
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목, 아이디, URL 검색…"
              />
            </div>
            <div className="viewtoggle" role="group" aria-label="보기 방식">
              <button
                className={`vt-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="그리드로 보기"
              >
                <IconGrid size={16} />
              </button>
              <button
                className={`vt-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="리스트로 보기"
              >
                <IconList size={16} />
              </button>
            </div>
            <button className="btn btn-primary" onClick={() => setEditing(null)}>
              <IconPlus size={17} /> 새 항목
            </button>
          </div>

          <div className="content">
            {filtered.length === 0 ? (
              <div className="empty">
                <div className="big">
                  <IconKey size={40} />
                </div>
                {entries.length === 0 ? (
                  <>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      아직 저장된 항목이 없어요
                    </div>
                    <div style={{ fontSize: 13 }}>‘새 항목’으로 첫 로그인 정보를 추가하세요.</div>
                  </>
                ) : (
                  <div>검색 결과가 없습니다.</div>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'entry-grid' : 'entry-list'}>
                {filtered.map((e) => (
                  <EntryCard key={e.id} entry={e} view={viewMode} onOpen={setViewing} dnd={dnd} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <StatusBar />

      {viewing && (
        <EntryDetail
          entry={viewing}
          onClose={() => setViewing(null)}
          onEdit={(e) => {
            setViewing(null)
            setEditing(e)
          }}
          onDelete={(e) => {
            void deleteEntry(e).then((ok) => {
              if (ok) setViewing(null)
            })
          }}
        />
      )}
      {editing !== undefined && (
        <EntryEditor initial={editing} onClose={() => setEditing(undefined)} onSave={saveEntry} />
      )}
      {showSync && <SyncPanel onClose={() => setShowSync(false)} onChanged={loadEntries} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <Toasts />
      <ConfirmDialog />
      {whatsNewVersion && (
        <WhatsNew version={whatsNewVersion} onClose={() => setWhatsNewVersion(null)} />
      )}
    </div>
  )
}
