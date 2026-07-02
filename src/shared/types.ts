// 메인 프로세스와 렌더러가 공유하는 타입 정의

export interface LoginEntry {
  id: string
  title: string // 사이트/서비스 이름 (예: "Google")
  username: string // 아이디 / 이메일
  password: string
  url?: string
  labels?: string[] // 라벨(다중). 예: ["업무","금융"]
  notes?: string
  icon?: string // 선택한 아이콘. 없으면 URL 파비콘 → 제목 첫 글자
  favorite?: boolean
  createdAt: string // ISO
  updatedAt: string // ISO
}

// 렌더러에 전달되는 항목 (평문 비밀번호 포함, 잠금 해제 상태에서만)
export type EntryInput = Omit<LoginEntry, 'id' | 'createdAt' | 'updatedAt'>

export interface VaultStatus {
  exists: boolean // vault.enc 파일이 존재하는가
  unlocked: boolean // 현재 잠금 해제 상태인가
  entryCount: number
}

export type SyncState = 'synced' | 'local-only' | 'remote-only' | 'conflict'

export interface SyncItemStatus {
  id: string
  title: string
  state: SyncState
  localUpdatedAt?: string
  remoteUpdatedAt?: string
}

export interface SyncSummary {
  signedIn: boolean
  email?: string
  items: SyncItemStatus[]
  lastSyncedAt?: string
}

export interface ApiResult<T = void> {
  ok: boolean
  error?: string
  data?: T
}

// preload가 노출하는 API 시그니처
export interface VaultApi {
  getStatus: () => Promise<VaultStatus>
  unlock: (masterPassword: string) => Promise<ApiResult<VaultStatus>>
  create: (masterPassword: string) => Promise<ApiResult<VaultStatus>>
  lock: () => Promise<ApiResult>
  changeMasterPassword: (current: string, next: string) => Promise<ApiResult>

  listEntries: () => Promise<ApiResult<LoginEntry[]>>
  addEntry: (input: EntryInput) => Promise<ApiResult<LoginEntry>>
  updateEntry: (id: string, input: EntryInput) => Promise<ApiResult<LoginEntry>>
  deleteEntry: (id: string) => Promise<ApiResult>

  // 동기화 (mangomail 서버 API)
  syncConfigured: () => Promise<boolean>
  syncGetConfig: () => Promise<ApiResult<{ apiUrl: string } | null>>
  syncSetConfig: (cfg: { apiUrl: string }) => Promise<ApiResult>
  syncStatus: () => Promise<ApiResult<SyncSummary>>
  syncSignIn: (email: string, password: string) => Promise<ApiResult<SyncSummary>>
  syncSignUp: (email: string, password: string) => Promise<ApiResult<SyncSummary>>
  syncSignOut: () => Promise<ApiResult>
  syncPushAll: () => Promise<ApiResult<SyncSummary>>
  syncPushOne: (id: string) => Promise<ApiResult<SyncSummary>>
  syncPull: () => Promise<ApiResult<SyncSummary>>
  syncDeleteRemote: (id: string) => Promise<ApiResult<SyncSummary>>
  syncDeleteAllRemote: () => Promise<ApiResult<SyncSummary>>

  // 앱/업데이트
  appVersion: () => Promise<string>
  checkForUpdates: () => Promise<ApiResult<string>>
  restartToUpdate: () => Promise<void>
  onUpdateEvent: (cb: (evt: UpdateEvent) => void) => () => void

  // 커스텀 창 컨트롤
  winMinimize: () => Promise<void>
  winMaximizeToggle: () => Promise<boolean>
  winClose: () => Promise<void>
  winIsMaximized: () => Promise<boolean>
  onMaximizeChange: (cb: (maximized: boolean) => void) => () => void
}

export interface UpdateEvent {
  type: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  message?: string
  percent?: number
  version?: string
}
