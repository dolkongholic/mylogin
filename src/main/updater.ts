import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'
import type { UpdateEvent } from '../shared/types'

// electron-updater + GitHub Releases 기반 자동 업데이트.
// 배포 설정은 electron-builder.yml 의 publish 항목 참고.

let win: BrowserWindow | null = null

function send(evt: UpdateEvent): void {
  win?.webContents.send('update-event', evt)
}

export function initUpdater(window: BrowserWindow): void {
  win = window
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => send({ type: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    send({ type: 'available', version: info.version, message: `새 버전 ${info.version} 발견` })
  )
  autoUpdater.on('update-not-available', () =>
    send({ type: 'not-available', message: '최신 버전입니다.' })
  )
  autoUpdater.on('download-progress', (p) =>
    send({ type: 'downloading', percent: Math.round(p.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    send({
      type: 'downloaded',
      version: info.version,
      message: `버전 ${info.version} 다운로드 완료. 재시작 시 적용됩니다.`
    })
  )
  autoUpdater.on('error', (err) => {
    // 업데이트 피드(GitHub 릴리스)가 아직 설정되지 않은 경우의 404 류는 조용히 무시
    if (isFeedMissing(err?.message)) return
    send({ type: 'error', message: err.message })
  })

  // 시작 후 잠시 뒤 자동 확인 (개발 모드에서는 스킵)
  if (!process.env.ELECTRON_RENDERER_URL) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => undefined)
    }, 4000)
  }
}

function isFeedMissing(msg?: string): boolean {
  if (!msg) return false
  return /404|latest\.yml|Cannot find|Unable to find|ERR_|net::|ENOTFOUND|getaddrinfo/i.test(msg)
}

export async function checkForUpdates(): Promise<string> {
  if (process.env.ELECTRON_RENDERER_URL) {
    return '개발 모드에서는 업데이트 확인을 건너뜁니다.'
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    return result?.updateInfo?.version
      ? `확인 완료 (최신 가용 버전: ${result.updateInfo.version})`
      : '확인 완료'
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (isFeedMissing(msg)) {
      return '자동 업데이트 서버가 아직 설정되지 않았어요. 현재 최신 버전을 사용 중입니다.'
    }
    return `업데이트 확인 실패: ${msg}`
  }
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
