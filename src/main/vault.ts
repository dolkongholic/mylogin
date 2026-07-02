import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {
  decrypt,
  defaultKdf,
  deriveKey,
  encrypt,
  makeVerifier,
  verifyKey,
  type KdfParams,
  type VaultFile
} from './crypto'
import type { EntryInput, LoginEntry } from '../shared/types'

// 볼트 파일 경로: %APPDATA%/mylogin/vault.enc
function vaultPath(): string {
  return path.join(app.getPath('userData'), 'vault.enc')
}

interface VaultState {
  unlocked: boolean
  key: Buffer | null
  kdf: KdfParams | null
  masterPassword: string | null // 동기화용 계정 키 파생에 필요 (서버 salt 기준)
  entries: LoginEntry[]
}

const state: VaultState = {
  unlocked: false,
  key: null,
  kdf: null,
  masterPassword: null,
  entries: []
}

function normalizeLabels(labels?: string[]): string[] | undefined {
  if (!labels) return undefined
  const cleaned = Array.from(new Set(labels.map((s) => s.trim()).filter(Boolean)))
  return cleaned.length ? cleaned : undefined
}

// 구버전(category: string) → labels 배열로 마이그레이션
function migrateEntries(list: LoginEntry[]): LoginEntry[] {
  return list.map((e) => {
    const legacy = e as LoginEntry & { category?: string }
    if (!e.labels && legacy.category) {
      const { category, ...rest } = legacy
      return { ...rest, labels: [category] }
    }
    return e
  })
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

export async function vaultExists(): Promise<boolean> {
  return fileExists(vaultPath())
}

export function isUnlocked(): boolean {
  return state.unlocked && state.key !== null
}

export function entryCount(): number {
  return state.entries.length
}

async function readVaultFile(): Promise<VaultFile> {
  const raw = await fs.readFile(vaultPath(), 'utf8')
  return JSON.parse(raw) as VaultFile
}

async function writeVaultFile(file: VaultFile): Promise<void> {
  const p = vaultPath()
  const tmp = `${p}.tmp`
  await fs.mkdir(path.dirname(p), { recursive: true })
  // 원자적 쓰기: 임시 파일에 먼저 쓴 뒤 교체 (쓰기 중 손상 방지)
  await fs.writeFile(tmp, JSON.stringify(file, null, 2), 'utf8')
  await fs.rename(tmp, p)
}

// 현재 메모리의 entries를 암호화해 디스크에 저장
async function persist(): Promise<void> {
  if (!state.key || !state.kdf) throw new Error('잠금 해제 상태가 아닙니다.')
  const file: VaultFile = {
    version: 1,
    kdf: state.kdf,
    verifier: makeVerifier(state.key),
    data: encrypt(state.key, JSON.stringify(state.entries)),
    updatedAt: new Date().toISOString()
  }
  await writeVaultFile(file)
}

// 새 볼트 생성 (마스터 비밀번호 최초 설정)
export async function createVault(masterPassword: string): Promise<void> {
  if (await vaultExists()) {
    throw new Error('이미 볼트가 존재합니다.')
  }
  if (!masterPassword || masterPassword.length < 4) {
    throw new Error('마스터 비밀번호는 4자 이상이어야 합니다.')
  }
  const kdf = defaultKdf()
  const key = deriveKey(masterPassword, kdf)
  state.kdf = kdf
  state.key = key
  state.masterPassword = masterPassword
  state.entries = []
  state.unlocked = true
  await persist()
}

// 기존 볼트 잠금 해제
export async function unlockVault(masterPassword: string): Promise<void> {
  const file = await readVaultFile()
  const key = deriveKey(masterPassword, file.kdf)
  if (!verifyKey(key, file.verifier)) {
    throw new Error('마스터 비밀번호가 올바르지 않습니다.')
  }
  const json = decrypt(key, file.data)
  state.entries = migrateEntries(JSON.parse(json) as LoginEntry[])
  state.kdf = file.kdf
  state.key = key
  state.masterPassword = masterPassword
  state.unlocked = true
}

export function lockVault(): void {
  if (state.key) state.key.fill(0) // 메모리에서 키 소거
  state.key = null
  state.kdf = null
  state.masterPassword = null
  state.entries = []
  state.unlocked = false
}

export async function changeMasterPassword(current: string, next: string): Promise<void> {
  ensureUnlocked()
  const file = await readVaultFile()
  const currentKey = deriveKey(current, file.kdf)
  if (!verifyKey(currentKey, file.verifier)) {
    throw new Error('현재 마스터 비밀번호가 올바르지 않습니다.')
  }
  if (!next || next.length < 4) {
    throw new Error('새 마스터 비밀번호는 4자 이상이어야 합니다.')
  }
  // 새 salt로 키 재파생 후 전체 재암호화
  const kdf = defaultKdf()
  const newKey = deriveKey(next, kdf)
  if (state.key) state.key.fill(0)
  state.kdf = kdf
  state.key = newKey
  state.masterPassword = next
  await persist()
}

export function getMasterPassword(): string {
  ensureUnlocked()
  if (!state.masterPassword) throw new Error('마스터 비밀번호가 메모리에 없습니다.')
  return state.masterPassword
}

function ensureUnlocked(): void {
  if (!isUnlocked()) throw new Error('볼트가 잠겨 있습니다.')
}

export function listEntries(): LoginEntry[] {
  ensureUnlocked()
  // 복사본 반환 (외부에서 메모리 직접 수정 방지)
  return state.entries.map((e) => ({ ...e }))
}

export function getEntry(id: string): LoginEntry | undefined {
  ensureUnlocked()
  const e = state.entries.find((x) => x.id === id)
  return e ? { ...e } : undefined
}

export async function addEntry(input: EntryInput): Promise<LoginEntry> {
  ensureUnlocked()
  const now = new Date().toISOString()
  const entry: LoginEntry = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    username: input.username,
    password: input.password,
    url: input.url?.trim() || undefined,
    labels: normalizeLabels(input.labels),
    notes: input.notes || undefined,
    icon: input.icon || undefined,
    favorite: !!input.favorite,
    createdAt: now,
    updatedAt: now
  }
  state.entries.push(entry)
  await persist()
  return { ...entry }
}

export async function updateEntry(id: string, input: EntryInput): Promise<LoginEntry> {
  ensureUnlocked()
  const idx = state.entries.findIndex((x) => x.id === id)
  if (idx === -1) throw new Error('항목을 찾을 수 없습니다.')
  const prev = state.entries[idx]
  const updated: LoginEntry = {
    ...prev,
    title: input.title.trim(),
    username: input.username,
    password: input.password,
    url: input.url?.trim() || undefined,
    labels: normalizeLabels(input.labels),
    notes: input.notes || undefined,
    icon: input.icon || undefined,
    favorite: !!input.favorite,
    updatedAt: new Date().toISOString()
  }
  state.entries[idx] = updated
  await persist()
  return { ...updated }
}

export async function deleteEntry(id: string): Promise<void> {
  ensureUnlocked()
  const idx = state.entries.findIndex((x) => x.id === id)
  if (idx === -1) throw new Error('항목을 찾을 수 없습니다.')
  state.entries.splice(idx, 1)
  await persist()
}

// 동기화 모듈이 항목 단위 암호화를 위해 사용
export function getKey(): Buffer {
  ensureUnlocked()
  return state.key as Buffer
}

export function getKdf(): KdfParams {
  ensureUnlocked()
  return state.kdf as KdfParams
}

// Pull로 받은 항목을 메모리에 병합 (updatedAt 기준 최신 우선)
export async function mergeEntries(incomingRaw: LoginEntry[]): Promise<void> {
  ensureUnlocked()
  const incoming = migrateEntries(incomingRaw)
  const map = new Map(state.entries.map((e) => [e.id, e]))
  for (const inc of incoming) {
    const existing = map.get(inc.id)
    if (!existing || new Date(inc.updatedAt) > new Date(existing.updatedAt)) {
      map.set(inc.id, inc)
    }
  }
  state.entries = Array.from(map.values())
  await persist()
}
