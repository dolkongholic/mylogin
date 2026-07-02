import { useEffect, useState, type JSX } from 'react'
import { IconPlus, IconMinus } from './icons'
import { useZoom, changeZoom, ZOOM_STEP, ZOOM_MIN, ZOOM_MAX } from '../lib/zoom'

function MangoMark({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="tbm" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ffe14d" />
          <stop offset="0.55" stopColor="#ffb53d" />
          <stop offset="1" stopColor="#ff8a2b" />
        </linearGradient>
      </defs>
      <path
        d="M256 96 C 360 96, 424 168, 424 280 C 424 384, 352 448, 256 448 C 160 448, 88 384, 88 280 C 88 168, 152 96, 256 96 Z"
        fill="url(#tbm)"
      />
      <path d="M256 110 C 280 64, 326 52, 360 70 C 330 86, 304 108, 288 138 Z" fill="#3f9e54" />
      <g fill="#7a3410">
        <circle cx="256" cy="262" r="52" />
        <path d="M234 298 L278 298 L296 384 L216 384 Z" />
      </g>
    </svg>
  )
}

export default function TitleBar(): JSX.Element {
  const zoom = useZoom()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.api.winIsMaximized().then(setMaximized)
    return window.api.onMaximizeChange(setMaximized)
  }, [])

  return (
    <div className="titlebar">
      {/* 왼쪽 끝: 글자 크기 조절 */}
      <div className="tb-zoomgroup">
        <button
          className="tb-zoom"
          onClick={() => changeZoom(-ZOOM_STEP)}
          disabled={zoom <= ZOOM_MIN + 0.001}
          title="글자 작게"
          aria-label="글자 작게"
        >
          <IconMinus size={15} />
        </button>
        <span className="tb-zoom-val" title="글자 크기">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="tb-zoom"
          onClick={() => changeZoom(ZOOM_STEP)}
          disabled={zoom >= ZOOM_MAX - 0.001}
          title="글자 크게"
          aria-label="글자 크게"
        >
          <IconPlus size={15} />
        </button>
      </div>

      {/* 가운데: 타이틀 */}
      <div className="titlebar-title">
        <MangoMark size={16} />
        <span>MangoLogin</span>
      </div>

      {/* 오른쪽 끝: 창 컨트롤 (최소화 / 최대화 / 닫기) */}
      <div className="traffic tb-right">
        <button
          className="traffic-btn min"
          onClick={() => window.api.winMinimize()}
          title="최소화"
          aria-label="최소화"
        >
          <svg viewBox="0 0 12 12" className="glyph">
            <path d="M3 6h6" />
          </svg>
        </button>
        <button
          className="traffic-btn max"
          onClick={() => window.api.winMaximizeToggle().then(setMaximized)}
          title={maximized ? '이전 크기로' : '최대화'}
          aria-label="최대화"
        >
          <svg viewBox="0 0 12 12" className="glyph">
            {maximized ? <path d="M4 4h4v4H4z" /> : <path d="M3.5 3.5h5v5h-5z" />}
          </svg>
        </button>
        <button
          className="traffic-btn close"
          onClick={() => window.api.winClose()}
          title="닫기"
          aria-label="닫기"
        >
          <svg viewBox="0 0 12 12" className="glyph">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
