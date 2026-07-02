import { contextBridge, ipcRenderer } from 'electron'
import type { EntryInput, UpdateEvent, VaultApi } from '../shared/types'

// 렌더러에 노출되는 안전한 API. nodeIntegration 없이 IPC만 통과시킨다.
const api: VaultApi = {
  getStatus: () => ipcRenderer.invoke('vault:status'),
  unlock: (masterPassword) => ipcRenderer.invoke('vault:unlock', masterPassword),
  create: (masterPassword) => ipcRenderer.invoke('vault:create', masterPassword),
  lock: () => ipcRenderer.invoke('vault:lock'),
  changeMasterPassword: (current, next) =>
    ipcRenderer.invoke('vault:changeMaster', current, next),

  listEntries: () => ipcRenderer.invoke('entry:list'),
  addEntry: (input: EntryInput) => ipcRenderer.invoke('entry:add', input),
  updateEntry: (id, input) => ipcRenderer.invoke('entry:update', id, input),
  deleteEntry: (id) => ipcRenderer.invoke('entry:delete', id),

  syncConfigured: () => ipcRenderer.invoke('sync:configured'),
  syncGetConfig: () => ipcRenderer.invoke('sync:getConfig'),
  syncSetConfig: (cfg) => ipcRenderer.invoke('sync:setConfig', cfg),
  syncStatus: () => ipcRenderer.invoke('sync:status'),
  syncSignIn: (email, password) => ipcRenderer.invoke('sync:signIn', email, password),
  syncSignUp: (email, password) => ipcRenderer.invoke('sync:signUp', email, password),
  syncSignOut: () => ipcRenderer.invoke('sync:signOut'),
  syncPushAll: () => ipcRenderer.invoke('sync:pushAll'),
  syncPushOne: (id) => ipcRenderer.invoke('sync:pushOne', id),
  syncPull: () => ipcRenderer.invoke('sync:pull'),
  syncDeleteRemote: (id) => ipcRenderer.invoke('sync:deleteRemote', id),
  syncDeleteAllRemote: () => ipcRenderer.invoke('sync:deleteAllRemote'),

  shareCreate: (itemId, email, permission) =>
    ipcRenderer.invoke('share:create', itemId, email, permission),
  shareList: () => ipcRenderer.invoke('share:list'),
  shareDelete: (shareId) => ipcRenderer.invoke('share:delete', shareId),
  shareUpdateBack: (shareId, input) => ipcRenderer.invoke('share:updateBack', shareId, input),

  appVersion: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  restartToUpdate: () => ipcRenderer.invoke('app:quitAndInstall'),
  getAutoLaunch: () => ipcRenderer.invoke('app:getAutoLaunch'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('app:setAutoLaunch', enabled),
  onUpdateEvent: (cb: (evt: UpdateEvent) => void) => {
    const listener = (_e: unknown, evt: UpdateEvent): void => cb(evt)
    ipcRenderer.on('update-event', listener)
    return () => ipcRenderer.removeListener('update-event', listener)
  },

  winMinimize: () => ipcRenderer.invoke('win:minimize'),
  winMaximizeToggle: () => ipcRenderer.invoke('win:maximizeToggle'),
  winClose: () => ipcRenderer.invoke('win:close'),
  winIsMaximized: () => ipcRenderer.invoke('win:isMaximized'),
  onMaximizeChange: (cb: (maximized: boolean) => void) => {
    const listener = (_e: unknown, max: boolean): void => cb(max)
    ipcRenderer.on('win:maximized', listener)
    return () => ipcRenderer.removeListener('win:maximized', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
