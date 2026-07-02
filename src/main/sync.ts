import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  decrypt,
  encrypt,
  makeVerifier,
  deriveKey,
  verifyKey,
  type KdfParams,
  type EncryptedBlob
} from './crypto'
import { getKdf, getMasterPassword, listEntries, mergeEntries } from './vault'
import type { LoginEntry, SyncSummary, SyncItemStatus, SyncState } from '../shared/types'

// ── mangomail 서버 API를 통한 동기화 (DB 직결 X) ─────────────
// - 앱에는 공개 서버 주소만 내장 (DB 비밀번호 없음 → 오픈 배포 안전)
// - 계정: POST /api/vault/login (mangomail 이메일+비번) → 토큰 발급
// - 저장: 토큰으로 /api/vault/items, /api/vault/meta 호출 → 서버가 본인 데이터만 허용
// - 제로지식: 항목은 마스터 비번 키로 클라이언트 암호화 → 서버는 내용 못 봄
// ─────────────────────────────────────────────────────────────

// 빌드 시 내장되는 mangomail 서버 주소 (공개, 노출돼도 안전)
const BAKED_API_URL = (
  import.meta as unknown as { env?: Record<string, string | undefined> }
).env?.MAIN_VITE_API_URL

interface SyncConfig {
  apiUrl: string
}

function configPath(): string {
  return path.join(app.getPath('userData'), 'sync-config.json')
}

let cachedConfig: SyncConfig | null = null
let session: { token: string; email: string } | null = null
let accountKey: Buffer | null = null // 서버 salt 기준으로 파생한 동기화 전용 키
let lastSyncedAt: string | undefined

export async function getConfig(): Promise<SyncConfig | null> {
  if (cachedConfig) return cachedConfig
  if (BAKED_API_URL) {
    cachedConfig = { apiUrl: BAKED_API_URL.replace(/\/$/, '') }
    return cachedConfig
  }
  if (process.env.MANGOMAIL_API_URL) {
    cachedConfig = { apiUrl: process.env.MANGOMAIL_API_URL.replace(/\/$/, '') }
    return cachedConfig
  }
  try {
    const raw = await fs.readFile(configPath(), 'utf8')
    const parsed = JSON.parse(raw) as SyncConfig
    if (parsed.apiUrl) {
      cachedConfig = { apiUrl: parsed.apiUrl.replace(/\/$/, '') }
      return cachedConfig
    }
  } catch {
    /* 없음 */
  }
  return null
}

export async function setConfig(cfg: SyncConfig): Promise<void> {
  await fs.writeFile(configPath(), JSON.stringify(cfg, null, 2), 'utf8')
  cachedConfig = { apiUrl: cfg.apiUrl.replace(/\/$/, '') }
}

export async function isConfigured(): Promise<boolean> {
  return (await getConfig()) !== null
}

async function base(): Promise<string> {
  const cfg = await getConfig()
  if (!cfg) throw new Error('동기화 서버 주소가 설정되지 않았습니다.')
  return cfg.apiUrl
}

function requireToken(): string {
  if (!session) throw new Error('로그인이 필요합니다.')
  return session.token
}

async function apiFetch(p: string, opts: RequestInit = {}, auth = true): Promise<unknown> {
  const url = (await base()) + p
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) headers.Authorization = `Bearer ${requireToken()}`
  let res: Response
  try {
    res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers as object) } })
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 네트워크를 확인하세요.')
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `요청 실패 (${res.status})`)
  }
  return data
}

// ── 계정 ──────────────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<void> {
  const data = (await apiFetch(
    '/api/vault/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false
  )) as { token: string; email: string }
  session = { token: data.token, email: data.email }
}

export async function signUp(email: string, password: string): Promise<void> {
  await apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }, false)
  await signIn(email, password)
}

export function signOut(): void {
  session = null
  if (accountKey) accountKey.fill(0)
  accountKey = null
}

// ── 계정 키 (서버 salt 기준 파생) ─────────────────────────────
// 동기화 항목은 이 키로 암복호화한다. 서버 salt를 쓰므로 재로그인/다른 기기에서도
// 같은 마스터 비밀번호면 동일 키가 되어 가져오기가 정상 동작한다.
interface MetaRow {
  kdfSalt: string
  kdfN: number
  kdfR: number
  kdfP: number
  verifier: string
}

async function ensureAccountKey(): Promise<Buffer> {
  if (accountKey) return accountKey
  requireToken()
  const mp = getMasterPassword()
  const res = (await apiFetch('/api/vault/meta', { method: 'GET' })) as { meta: MetaRow | null }
  if (res.meta) {
    const kdf: KdfParams = {
      salt: res.meta.kdfSalt,
      N: res.meta.kdfN,
      r: res.meta.kdfR,
      p: res.meta.kdfP
    }
    const key = deriveKey(mp, kdf)
    let verifier: EncryptedBlob
    try {
      verifier = JSON.parse(res.meta.verifier) as EncryptedBlob
    } catch {
      verifier = res.meta.verifier as unknown as EncryptedBlob
    }
    if (!verifyKey(key, verifier)) {
      throw new Error('서버 금고를 만든 마스터 비밀번호와 다릅니다. 같은 비밀번호로 로그인하세요.')
    }
    accountKey = key
  } else {
    // 최초 동기화: 현재 로컬 kdf로 메타 생성 (기존 로컬키 blob과도 호환)
    const kdf = getKdf()
    const key = deriveKey(mp, kdf)
    await apiFetch('/api/vault/meta', {
      method: 'PUT',
      body: JSON.stringify({
        kdfSalt: kdf.salt,
        kdfN: kdf.N,
        kdfR: kdf.r,
        kdfP: kdf.p,
        verifier: JSON.stringify(makeVerifier(key))
      })
    })
    accountKey = key
  }
  return accountKey
}

// ── 암호화 헬퍼 (계정 키 사용) ────────────────────────────────
function encryptEntry(entry: LoginEntry): { id: string; blob: string; updatedAt: string } {
  const key = accountKey as Buffer
  return {
    id: entry.id,
    blob: JSON.stringify(encrypt(key, JSON.stringify(entry))),
    updatedAt: entry.updatedAt
  }
}

function decryptBlob(blob: string): LoginEntry | null {
  try {
    return JSON.parse(decrypt(accountKey as Buffer, JSON.parse(blob))) as LoginEntry
  } catch {
    return null
  }
}

// ── 업로드 / 가져오기 / 삭제 ─────────────────────────────────
export async function pushAll(): Promise<void> {
  await ensureAccountKey()
  const items = listEntries().map(encryptEntry)
  if (items.length > 0) {
    await apiFetch('/api/vault/items', { method: 'POST', body: JSON.stringify({ items }) })
  }
  lastSyncedAt = new Date().toISOString()
}

export async function pushOne(id: string): Promise<void> {
  await ensureAccountKey()
  const entry = listEntries().find((e) => e.id === id)
  if (!entry) throw new Error('항목을 찾을 수 없습니다.')
  await apiFetch('/api/vault/items', {
    method: 'POST',
    body: JSON.stringify({ items: [encryptEntry(entry)] })
  })
  lastSyncedAt = new Date().toISOString()
}

interface RemoteItem {
  id: string
  blob: string
  updatedAt: string
}

async function fetchRemote(): Promise<RemoteItem[]> {
  const data = (await apiFetch('/api/vault/items', { method: 'GET' })) as { items: RemoteItem[] }
  return data.items ?? []
}

export async function pull(): Promise<{ merged: number; failed: number }> {
  await ensureAccountKey()
  const rows = await fetchRemote()
  const decrypted: LoginEntry[] = []
  let failed = 0
  for (const r of rows) {
    const e = decryptBlob(r.blob)
    if (e) decrypted.push(e)
    else failed++
  }
  if (decrypted.length > 0) await mergeEntries(decrypted)
  lastSyncedAt = new Date().toISOString()
  return { merged: decrypted.length, failed }
}

export async function deleteRemote(id: string): Promise<void> {
  requireToken()
  await apiFetch(`/api/vault/items?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  lastSyncedAt = new Date().toISOString()
}

export async function deleteAllRemote(): Promise<void> {
  requireToken()
  await apiFetch('/api/vault/items?all=1', { method: 'DELETE' })
  lastSyncedAt = new Date().toISOString()
}

// ── 상태 비교 ─────────────────────────────────────────────────
export async function status(): Promise<SyncSummary> {
  if (!session) return { signedIn: false, items: [], lastSyncedAt }
  await ensureAccountKey()
  const local = listEntries()
  const rows = await fetchRemote()
  const remoteMap = new Map(rows.map((r) => [r.id, r]))
  const items: SyncItemStatus[] = []
  const seen = new Set<string>()

  for (const e of local) {
    seen.add(e.id)
    const r = remoteMap.get(e.id)
    let st: SyncState
    if (!r) st = 'local-only'
    else if (new Date(r.updatedAt).getTime() === new Date(e.updatedAt).getTime()) st = 'synced'
    else st = 'conflict'
    items.push({
      id: e.id,
      title: e.title,
      state: st,
      localUpdatedAt: e.updatedAt,
      remoteUpdatedAt: r?.updatedAt
    })
  }
  for (const r of rows) {
    if (seen.has(r.id)) continue
    const e = decryptBlob(r.blob)
    items.push({ id: r.id, title: e?.title ?? '(암호화된 항목)', state: 'remote-only', remoteUpdatedAt: r.updatedAt })
  }
  items.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  return { signedIn: true, email: session.email, items, lastSyncedAt }
}
