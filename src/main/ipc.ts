import { ipcMain, app } from 'electron'
import * as vault from './vault'
import * as sync from './sync'
import { checkForUpdates } from './updater'
import type { ApiResult, EntryInput, VaultStatus } from '../shared/types'

// 모든 핸들러를 ApiResult 형태로 감싸는 헬퍼 (에러를 안전하게 렌더러로 전달)
async function wrap<T>(fn: () => Promise<T> | T): Promise<ApiResult<T>> {
  try {
    const data = await fn()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

async function buildStatus(): Promise<VaultStatus> {
  return {
    exists: await vault.vaultExists(),
    unlocked: vault.isUnlocked(),
    entryCount: vault.isUnlocked() ? vault.entryCount() : 0
  }
}

export function registerIpc(): void {
  // ── 볼트 ──────────────────────────────────────────────
  ipcMain.handle('vault:status', () => buildStatus())

  ipcMain.handle('vault:unlock', (_e, masterPassword: string) =>
    wrap(async () => {
      await vault.unlockVault(masterPassword)
      return buildStatus()
    })
  )

  ipcMain.handle('vault:create', (_e, masterPassword: string) =>
    wrap(async () => {
      await vault.createVault(masterPassword)
      return buildStatus()
    })
  )

  ipcMain.handle('vault:lock', () =>
    wrap(() => {
      vault.lockVault()
    })
  )

  ipcMain.handle('vault:changeMaster', (_e, current: string, next: string) =>
    wrap(() => vault.changeMasterPassword(current, next))
  )

  // ── 항목 CRUD ─────────────────────────────────────────
  ipcMain.handle('entry:list', () => wrap(() => vault.listEntries()))
  ipcMain.handle('entry:add', (_e, input: EntryInput) => wrap(() => vault.addEntry(input)))
  ipcMain.handle('entry:update', (_e, id: string, input: EntryInput) =>
    wrap(() => vault.updateEntry(id, input))
  )
  ipcMain.handle('entry:delete', (_e, id: string) => wrap(() => vault.deleteEntry(id)))

  // ── 동기화 ────────────────────────────────────────────
  ipcMain.handle('sync:configured', () => sync.isConfigured())
  ipcMain.handle('sync:getConfig', () => wrap(() => sync.getConfig()))
  ipcMain.handle('sync:setConfig', (_e, cfg: { apiUrl: string }) => wrap(() => sync.setConfig(cfg)))
  ipcMain.handle('sync:status', () => wrap(() => sync.status()))
  ipcMain.handle('sync:signIn', (_e, email: string, password: string) =>
    wrap(async () => {
      await sync.signIn(email, password)
      return sync.status()
    })
  )
  ipcMain.handle('sync:signUp', (_e, email: string, password: string) =>
    wrap(async () => {
      await sync.signUp(email, password)
      return sync.status()
    })
  )
  ipcMain.handle('sync:signOut', () => wrap(() => sync.signOut()))
  ipcMain.handle('sync:pushAll', () =>
    wrap(async () => {
      await sync.pushAll()
      return sync.status()
    })
  )
  ipcMain.handle('sync:pushOne', (_e, id: string) =>
    wrap(async () => {
      await sync.pushOne(id)
      return sync.status()
    })
  )
  ipcMain.handle('sync:pull', () =>
    wrap(async () => {
      await sync.pull()
      return sync.status()
    })
  )
  ipcMain.handle('sync:deleteRemote', (_e, id: string) =>
    wrap(async () => {
      await sync.deleteRemote(id)
      return sync.status()
    })
  )
  ipcMain.handle('sync:deleteAllRemote', () =>
    wrap(async () => {
      await sync.deleteAllRemote()
      return sync.status()
    })
  )

  // ── 공유 (E2E) ────────────────────────────────────────
  ipcMain.handle('share:create', (_e, itemId: string, email: string, perm: 'read' | 'edit') =>
    wrap(() => sync.shareCreate(itemId, email, perm))
  )
  ipcMain.handle('share:list', () => wrap(() => sync.shareList()))
  ipcMain.handle('share:delete', (_e, shareId: string) => wrap(() => sync.shareDelete(shareId)))
  ipcMain.handle('share:updateBack', (_e, shareId: string, input: EntryInput) =>
    wrap(() => sync.shareUpdateBack(shareId, input))
  )
  ipcMain.handle('share:reshare', (_e, itemId: string) => wrap(() => sync.reshareItem(itemId)))

  // ── 앱/업데이트 ───────────────────────────────────────
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:checkForUpdates', () => wrap(() => checkForUpdates()))
}
