import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { registerIpc } from './ipc'
import { initUpdater, quitAndInstall } from './updater'

// .env 로드 (DATABASE_URL 등). 개발 모드: 프로젝트 루트, 패키지: 앱 경로 옆.
loadEnv()
loadEnv({ path: join(app.getAppPath(), '.env') })

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 840,
    minHeight: 560,
    show: false,
    frame: false, // 커스텀 타이틀바 사용 (프레임리스)
    titleBarStyle: 'hidden',
    title: 'MangoLogin',
    icon: join(__dirname, '../../build/icon.png'),
    backgroundColor: '#0f1115',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // ── 커스텀 창 컨트롤 ──────────────────────────────
  ipcMain.removeHandler('win:minimize')
  ipcMain.removeHandler('win:maximizeToggle')
  ipcMain.removeHandler('win:close')
  ipcMain.removeHandler('win:isMaximized')
  ipcMain.handle('win:minimize', () => win.minimize())
  ipcMain.handle('win:maximizeToggle', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
    return win.isMaximized()
  })
  ipcMain.handle('win:close', () => win.close())
  ipcMain.handle('win:isMaximized', () => win.isMaximized())
  win.on('maximize', () => win.webContents.send('win:maximized', true))
  win.on('unmaximize', () => win.webContents.send('win:maximized', false))

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  registerIpc()
  ipcMain.handle('app:quitAndInstall', () => quitAndInstall())

  const win = createWindow()
  initUpdater(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 단일 인스턴스 보장
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}
