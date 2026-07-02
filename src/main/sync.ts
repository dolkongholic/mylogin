import { app } from 'electron'
import { promises as fs } from 'node:fs'
import * as fsSync from 'node:fs'
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
import {
  deriveBoxKeyPair,
  boxPublicKeyB64,
  boxEncryptFor,
  boxDecrypt,
  type BoxPayload
} from './box'
import type {
  LoginEntry,
  SyncSummary,
  SyncItemStatus,
  SyncState,
  SharePermission,
  SharesResult,
  SharedReceived,
  ShareMade,
  EntryInput
} from '../shared/types'

type BoxKeyPairT = ReturnType<typeof deriveBoxKeyPair>

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

function sessionPath(): string {
  return path.join(app.getPath('userData'), 'sync-session.json')
}

// 로그인 토큰을 디스크에 저장/복원 → 재시작(업데이트) 후에도 로그인 유지.
// (토큰은 사용자 범위 + 만료 있음. 금고 내용은 별도 마스터 비번으로 암호화됨)
function persistSession(): void {
  try {
    if (session) fsSync.writeFileSync(sessionPath(), JSON.stringify(session), 'utf8')
  } catch {
    /* 무시 */
  }
}
function clearSessionFile(): void {
  try {
    fsSync.rmSync(sessionPath(), { force: true })
  } catch {
    /* 무시 */
  }
}
let sessionRestored = false
function restoreSessionSync(): void {
  if (sessionRestored) return
  sessionRestored = true
  try {
    const raw = fsSync.readFileSync(sessionPath(), 'utf8')
    const parsed = JSON.parse(raw) as { token: string; email: string }
    if (parsed?.token && parsed?.email) session = parsed
  } catch {
    /* 없음 */
  }
}

let cachedConfig: SyncConfig | null = null
let session: { token: string; email: string } | null = null
let accountKey: Buffer | null = null // 서버 salt 기준으로 파생한 동기화 전용 키
let accountKdf: KdfParams | null = null
let boxPair: BoxKeyPairT | null = null
let pubkeyRegistered = false
const receivedCtx = new Map<string, { ownerEmail: string; itemId: string }>()
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
  if (!session) restoreSessionSync()
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
  persistSession()
}

export async function signUp(email: string, password: string): Promise<void> {
  await apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }, false)
  await signIn(email, password)
}

export function signOut(): void {
  session = null
  clearSessionFile()
  if (accountKey) accountKey.fill(0)
  accountKey = null
  accountKdf = null
  boxPair = null
  pubkeyRegistered = false
  receivedCtx.clear()
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
    accountKdf = kdf
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
    accountKdf = kdf
  }
  return accountKey
}

// 공유용 박스 키쌍 준비 + 공개키 서버 등록 (세션 1회)
async function ensureBox(): Promise<BoxKeyPairT> {
  const key = await ensureAccountKey()
  if (!boxPair) boxPair = deriveBoxKeyPair(key)
  if (!pubkeyRegistered && accountKdf) {
    await apiFetch('/api/vault/meta', {
      method: 'PUT',
      body: JSON.stringify({
        kdfSalt: accountKdf.salt,
        kdfN: accountKdf.N,
        kdfR: accountKdf.r,
        kdfP: accountKdf.p,
        verifier: JSON.stringify(makeVerifier(key)),
        boxPublicKey: boxPublicKeyB64(boxPair)
      })
    })
    pubkeyRegistered = true
  }
  return boxPair
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
  if (!session) restoreSessionSync()
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

// ── 공유 (E2E) ────────────────────────────────────────────────
async function lookupPubKey(email: string): Promise<string> {
  const data = (await apiFetch(
    `/api/vault/pubkey?email=${encodeURIComponent(email)}`,
    { method: 'GET' }
  )) as { publicKey: string }
  return data.publicKey
}

export async function shareCreate(
  itemId: string,
  recipientEmail: string,
  permission: SharePermission
): Promise<void> {
  await ensureBox()
  const entry = listEntries().find((e) => e.id === itemId)
  if (!entry) throw new Error('항목을 찾을 수 없습니다.')
  const pub = await lookupPubKey(recipientEmail.trim().toLowerCase())
  const payload = boxEncryptFor(pub, JSON.stringify(entry))
  await apiFetch('/api/vault/shares', {
    method: 'POST',
    body: JSON.stringify({
      itemId,
      recipientEmail: recipientEmail.trim().toLowerCase(),
      permission,
      payload,
      title: entry.title
    })
  })
}

export async function shareDelete(shareId: string): Promise<void> {
  requireToken()
  await apiFetch(`/api/vault/shares?id=${encodeURIComponent(shareId)}`, { method: 'DELETE' })
}

interface RawShares {
  received: Array<{
    id: string
    itemId: string
    permission: SharePermission
    payload: BoxPayload
    title: string | null
    updatedAt: string
    ownerEmail: string
  }>
  made: Array<{
    id: string
    itemId: string
    permission: SharePermission
    ownerPayload: BoxPayload | null
    title: string | null
    updatedAt: string
    recipientEmail: string
  }>
}

export async function shareList(): Promise<SharesResult> {
  const pair = await ensureBox()
  const raw = (await apiFetch('/api/vault/shares', { method: 'GET' })) as RawShares

  // 받은 공유 복호화
  const received: SharedReceived[] = []
  let receivedFailed = 0
  receivedCtx.clear()
  for (const s of raw.received) {
    const json = boxDecrypt(s.payload, pair.secretKey)
    if (!json) {
      receivedFailed++
      continue
    }
    let entry: LoginEntry
    try {
      entry = JSON.parse(json) as LoginEntry
    } catch {
      receivedFailed++
      continue
    }
    // "공유받음" 라벨 부여 (표시용)
    const labels = Array.from(new Set([...(entry.labels ?? []), '공유받음']))
    received.push({
      shareId: s.id,
      ownerEmail: s.ownerEmail,
      permission: s.permission,
      entry: { ...entry, id: s.itemId, labels }
    })
    receivedCtx.set(s.id, { ownerEmail: s.ownerEmail, itemId: s.itemId })
  }

  // 내가 공유한 것 — 수신자가 수정(ownerPayload)했으면 내 항목에 반영
  let applied = 0
  const made: ShareMade[] = []
  for (const s of raw.made) {
    made.push({
      shareId: s.id,
      itemId: s.itemId,
      recipientEmail: s.recipientEmail,
      permission: s.permission,
      title: s.title ?? undefined
    })
    if (s.ownerPayload) {
      const json = boxDecrypt(s.ownerPayload, pair.secretKey)
      if (json) {
        try {
          const updated = JSON.parse(json) as LoginEntry
          await mergeEntries([{ ...updated, id: s.itemId }])
          applied++
          // 반영 후 수신자용 payload 갱신 + ownerPayload 정리를 위해 재공유
          try {
            const pub = await lookupPubKey(s.recipientEmail)
            const entry = listEntries().find((e) => e.id === s.itemId)
            if (entry) {
              await apiFetch('/api/vault/shares', {
                method: 'POST',
                body: JSON.stringify({
                  itemId: s.itemId,
                  recipientEmail: s.recipientEmail,
                  permission: s.permission,
                  payload: boxEncryptFor(pub, JSON.stringify(entry)),
                  title: entry.title
                })
              })
            }
          } catch {
            /* 재공유 실패는 무시 */
          }
        } catch {
          /* 무시 */
        }
      }
    }
  }

  return { received, made, appliedOwnerUpdates: applied, receivedFailed }
}

// 수신자(edit 권한)가 공유 항목을 수정 → 소유자에게 되돌려 보냄
export async function shareUpdateBack(shareId: string, input: EntryInput): Promise<void> {
  const pair = await ensureBox()
  const ctx = receivedCtx.get(shareId)
  if (!ctx) throw new Error('공유 정보를 찾을 수 없습니다. 먼저 새로고침하세요.')
  const now = new Date().toISOString()
  const entry: LoginEntry = {
    id: ctx.itemId,
    title: input.title.trim(),
    username: input.username,
    password: input.password,
    url: input.url?.trim() || undefined,
    labels: input.labels?.filter((l) => l !== '공유받음' && l !== '공유함'),
    notes: input.notes || undefined,
    icon: input.icon || undefined,
    favorite: !!input.favorite,
    createdAt: now,
    updatedAt: now
  }
  const selfPayload = boxEncryptFor(boxPublicKeyB64(pair), JSON.stringify(entry))
  const ownerPub = await lookupPubKey(ctx.ownerEmail)
  const ownerPayload = boxEncryptFor(ownerPub, JSON.stringify(entry))
  await apiFetch('/api/vault/shares', {
    method: 'PUT',
    body: JSON.stringify({ id: shareId, payload: selfPayload, ownerPayload })
  })
}

// 소유자가 공유한 항목을 수정했을 때, 모든 수신자에게 재암호화해 재공유 (자동 반영)
export async function reshareItem(itemId: string): Promise<number> {
  await ensureBox()
  const entry = listEntries().find((e) => e.id === itemId)
  if (!entry) return 0
  const raw = (await apiFetch('/api/vault/shares', { method: 'GET' })) as RawShares
  const mine = raw.made.filter((m) => m.itemId === itemId)
  for (const m of mine) {
    try {
      const pub = await lookupPubKey(m.recipientEmail)
      await apiFetch('/api/vault/shares', {
        method: 'POST',
        body: JSON.stringify({
          itemId,
          recipientEmail: m.recipientEmail,
          permission: m.permission,
          payload: boxEncryptFor(pub, JSON.stringify(entry)),
          title: entry.title
        })
      })
    } catch {
      /* 개별 실패 무시 */
    }
  }
  return mine.length
}
