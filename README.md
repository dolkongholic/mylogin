# myLogin — 로컬 우선 암호화 로그인 관리 프로그램

아이디/비밀번호를 **마스터 비밀번호로 암호화(AES-256-GCM)** 하여 로컬에 저장하고,
원할 때만 **mangomail과 같은 Postgres(Supabase)** 로 **제로지식 암호화 상태로 백업/동기화**하는 Electron 데스크톱 앱.

## 핵심 기능

- 🔐 마스터 비밀번호 1개로 잠금/해제 (scrypt 키파생 → AES-256-GCM). 마스터 비번은 **저장하지 않음**
- 💾 로컬 우선 저장 (`%APPDATA%/mylogin/vault.enc`)
- 🔗 **mangomail 계정 통합**: 같은 계정(이메일+비번)으로 로그인, 같은 DB에 동기화
- ☁️ 제로지식 동기화: 서버엔 **암호문만** 저장 → mangomail 서버/운영자도 내용 못 봄
- 🗑️ 항목 단위 업로드/삭제, 서버 전체 삭제 지원
- 🌗 다크 / 라이트 테마
- ♾️ 항목 무제한
- 🔑 비밀번호 생성기 / 강도 표시 / 즐겨찾기 / 검색
- 🔄 자동 업데이트 (electron-updater + GitHub Releases)

## 개발

```bash
npm install
npm run dev        # 개발 모드 (핫리로드)
npm run typecheck  # 타입 검사
npm run dist:win   # Windows 설치 파일(.exe) 빌드 → dist/
```

## 보안 설계

- 모든 암복호화는 **메인 프로세스**에서만 수행. 렌더러(웹 화면)는 평문 키를 갖지 않음
- 잘못된 마스터 비밀번호는 GCM 인증 태그 검증 실패로 자동 거부
- 잠금 시 메모리의 키를 0으로 소거
- 서버에는 **암호문 payload만** 업로드 → Supabase 운영자도 내용 열람 불가

> ⚠️ 마스터 비밀번호는 복구 불가입니다. 분실 시 데이터 복호화가 불가능합니다.

## 서버 동기화 설정 (mangomail 통합)

mangomail과 **같은 Postgres·같은 계정**을 씁니다. 별도 Supabase 프로젝트가 필요 없어요.

1. `mangomail/.env.local` 의 `DATABASE_URL` 값을 mylogin `.env` 의 `DATABASE_URL` 에 복사
   (또는 앱 → **서버 동기화** → 연결 저장에 붙여넣기)
2. 앱 → **서버 동기화** → mangomail 계정(이메일+비밀번호)으로 로그인
3. **전체 업로드** 클릭 → 로컬 금고가 암호문으로 DB에 백업됨

### DB 테이블

앱이 처음 동기화할 때 아래 두 테이블을 `CREATE TABLE IF NOT EXISTS` 로 **자동 생성**합니다.
(mangomail `prisma/schema.prisma` 의 `Credential` / `CredentialVault` 모델과 동일)

| 테이블 | 용도 |
|--------|------|
| `Credential` | 항목별 암호문 blob (제목·아이디·비번 모두 암호화). 서버는 내용 못 봄 |
| `CredentialVault` | 사용자별 마스터키 파생 파라미터 + 검증용 암호문 |

- 인증: mangomail 의 `User` 테이블(NextAuth, bcrypt) — 같은 계정
- 암호화: 마스터 비밀번호로 클라이언트에서만 복호화 (NEXTAUTH_SECRET 과 무관, 제로지식)

> ⚠️ 직접 DB 연결 방식이라 `.env` 의 `DATABASE_URL` 은 DB 전체 접근 권한을 가집니다.
> 개인 PC 용으로만 두고, 공용 PC엔 `.env` 를 남기지 마세요.

## 자동 업데이트 배포

1. `electron-builder.yml` 의 `publish.owner` / `publish.repo` 를 본인 GitHub 저장소로 수정
2. `package.json` 의 `version` 을 올림
3. 환경변수 `GH_TOKEN` (repo 권한) 설정 후:
   ```bash
   npx electron-builder --win --publish always
   ```
4. 사용자 앱은 실행 시 자동으로 새 버전을 확인·다운로드하고, 재시작 시 적용
