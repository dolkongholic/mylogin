import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { registerIpc } from './ipc'
import { initUpdater, quitAndInstall } from './updater'

// .env 로드 (개발: 프로젝트 루트, 패키지: 앱 경로 옆)
loadEnv()
loadEnv({ path: join(app.getAppPath(), '.env') })

let tray: Tray | null = null
let isQuitting = false
let trayHintShown = false

function iconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'icon.png')
    : join(__dirname, '../../build/icon.png')
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 840,
    minHeight: 560,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    title: 'MangoLogin',
    icon: iconPath(),
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

  // 닫기 → 종료하지 않고 트레이로 숨김 (트레이 메뉴의 '종료'로만 완전 종료)
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      win.hide()
      // 처음 숨길 때 트레이 위치 안내 (Windows 11은 새 아이콘을 ^ 숨김영역에 넣음)
      if (!trayHintShown && tray) {
        trayHintShown = true
        try {
          tray.displayBalloon({
            title: 'MangoLogin은 계속 실행 중이에요',
            content: '창을 닫아도 종료되지 않고 트레이로 이동합니다. 작업표시줄 오른쪽 “^”(숨은 아이콘)에서 MangoLogin을 찾을 수 있어요. 완전히 끄려면 트레이 아이콘 우클릭 → 종료.'
          })
        } catch {
          /* 무시 */
        }
      }
    }
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
  ipcMain.handle('win:close', () => win.close()) // → close 이벤트 → 트레이로 숨김
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

function createTray(win: BrowserWindow): void {
  let image = nativeImage.createFromPath(iconPath())
  if (!image.isEmpty()) image = image.resize({ width: 16, height: 16 })
  tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image)
  tray.setToolTip('MangoLogin')

  const showWin = (): void => {
    win.show()
    win.focus()
  }
  const menu = Menu.buildFromTemplate([
    { label: '열기', click: showWin },
    { type: 'separator' },
    {
      label: '종료',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.on('click', showWin)
  tray.on('double-click', showWin)
}

app.whenReady().then(() => {
  registerIpc()
  ipcMain.handle('app:quitAndInstall', () => {
    isQuitting = true
    quitAndInstall()
  })

  // PC 시작 시 자동 실행
  ipcMain.handle('app:getAutoLaunch', () => app.getLoginItemSettings().openAtLogin)
  ipcMain.handle('app:setAutoLaunch', (_e, enabled: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      args: [] // 필요 시 '--hidden' 등 추가 가능
    })
    return app.getLoginItemSettings().openAtLogin
  })

  const win = createWindow()
  createTray(win)
  initUpdater(win)

  app.on('activate', () => {
    const w = BrowserWindow.getAllWindows()[0]
    if (w) w.show()
    else createWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

// 트레이 상주 앱: 창을 닫아도 종료하지 않음 (window-all-closed 에서 quit 안 함)
app.on('window-all-closed', () => {
  // 트레이로 상주. 완전 종료는 트레이 '종료' 메뉴에서.
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
      win.show()
      win.focus()
    }
  })
}
