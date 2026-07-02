// 버전별 패치 내용 (What's New). 새 버전 낼 때 여기에 항목을 계속 추가.
// CHANGELOG.md 와 내용을 맞춘다.

export interface ReleaseNote {
  title: string
  items: string[]
}

export const RELEASE_NOTES: Record<string, ReleaseNote> = {
  '0.2.0': {
    title: 'v0.2.0 — 라벨 · 동기화 수정',
    items: [
      '🏷️ 라벨(다중): 한 항목에 여러 라벨을 지정할 수 있어요 (기존 카테고리 대체)',
      '🔄 동기화 가져오기 버그 수정: 재로그인·다른 기기에서도 서버 항목이 정상적으로 내려옵니다',
      '🌐 URL 파비콘을 기본 아이콘으로 표시',
      '📐 그리드 카드 높이 통일',
      '🔒 자동 잠금(미사용 시), 🔡 글자 크기 조절, ↕️ 리스트/그리드 드래그 정렬',
      '⬆️ 업데이트 알림 개선: 다운로드 후 재시작 여부를 물어봅니다'
    ]
  }
}

const SEEN_KEY = 'mylogin-seen-version'

// 업데이트되어 처음 실행됐는지 (최초 설치는 제외)
export function isFreshUpdate(current: string): boolean {
  const seen = localStorage.getItem(SEEN_KEY)
  if (seen === null) return false // 최초 설치
  return seen !== current
}

export function markVersionSeen(current: string): void {
  localStorage.setItem(SEEN_KEY, current)
}

export function notesFor(version: string): ReleaseNote | null {
  return RELEASE_NOTES[version] ?? null
}
