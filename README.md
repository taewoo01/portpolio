# portpolio

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-Desktop_Shell-47848F?logo=electron&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)

**Notion처럼 문서를 정리하고 일정을 관리하며, 정리한 내용을 블로그로 공개 발행할 수 있는 개인용 지식 허브 + 홈페이지.**

## 소개

위키(문서 정리), 캘린더(일정/할 일), 타이머(학습·작업 시간 측정), 블로그(공개 발행)를
하나의 Next.js 앱에서 제공하는 개인용 서비스다. 회원가입이나 소셜 로그인은 없고,
4명의 고정 사용자(`taewoo`/`yujin`/`hoyoung`/`donghyun`)가 각자 PIN으로 로그인해서
같은 앱을 함께 쓰며, 사용자별로 보이는 데이터를 제한할 수 있다 (`taewoo`는 관리자로
전체를 보고, `yujin`↔`hoyoung`, `yujin`↔`donghyun`은 서로의 비공개 항목을 못 본다).

별도의 프론트엔드/백엔드 저장소 분리는 없다 — 이 저장소 하나가 Next.js App Router로
서버(API, Server Actions, DB 접근)와 클라이언트를 모두 포함한다. 다만 `electron/`
디렉터리에 **데스크톱 셸**이 별도로 들어있는데, 이 셸은 자체 서버 로직 없이 배포된
웹앱 URL(`electron/main.js`에 하드코딩된 `https://portpolio-beta-mocha.vercel.app`)을
그대로 띄우는 thin 클라이언트이고, 항상 위에 떠 있는 네이티브 플로팅 타이머 창
기능만 추가로 제공한다.

git 로그상 첫 커밋은 2026-06-08 (`Initial commit from Create Next App`)이고, 현재까지
모든 커밋의 작성자는 `taewoo01` 한 명이다.

## 주요 기능

| 기능 | 진입점 | 설명 |
|---|---|---|
| 홈 대시보드 | `/` (`src/app/page.tsx`) | 오늘 일정/할 일, 최근 문서, 진행 중 문서, 최근 블로그 글, 통계 카드 |
| 위키 (지식 베이스) | `/wiki`, `/wiki/[documentId]` | 카테고리(`WorkspaceCategory`) 기반 폴더·문서 트리, 마크다운 에디터, GitHub README 가져오기, 드래그 앤 드롭으로 파일/폴더 이동 |
| 블로그 발행 | `/blog`, `/blog/[slug]` | 위키 문서를 공개 글로 발행, 카테고리·폴더별 그룹핑, 이미지 라이트박스, PDF 내보내기 |
| PDF 내보내기 | `GET /api/blog/[slug]/pdf` | 서버에서 헤드리스 Chromium으로 블로그 글을 PDF로 변환해 다운로드 |
| 일정 관리 | `/calendar` | 월간 캘린더, 반복 일정, 할 일(Todo) |
| 타이머 | `/timer`, `/timer/float` | 학습/작업 시간 측정, 항상 위에 떠 있는 플로팅 타이머(브라우저 팝업 또는 Electron 네이티브 창), 주간/월간 통계 |
| 통합 검색 | `Ctrl+K` 팔레트 (`src/components/search`) | 문서 제목/본문 검색, 카테고리 필터 |
| About | `/about` | DB에 저장된 프로필(`AboutProfile`)을 사용자가 직접 편집 |
| 로그인 | `/login` | 4인 고정 사용자 PIN 로그인, 5회 실패 시 IP 기준 15분 잠금 + 같은 PIN 반복 실패 시 응답 지연(백오프) |
| 이미지 업로드 | `POST /api/upload` | Vercel Blob에 업로드 후 URL 반환 (에디터 이미지 첨부용) |
| 데스크톱 앱 | `electron/main.js` | 배포된 웹앱을 그대로 로드하는 네이티브 셸 + 항상-위 플로팅 타이머 창 |

## 동작 방식

1. 브라우저가 라우트를 요청하면 `src/proxy.ts` 미들웨어가 `iron-session` 쿠키를 확인한다. 세션이 없으면 `/login`으로 리다이렉트한다 (`/login`, `/timer/float`만 예외).
2. 미들웨어와 별개로 비공개 페이지/레이아웃도 진입부에서 `getUser()`를 직접 확인해 비로그인 시 `/login`으로 리다이렉트한다 (미들웨어 우회 대비 다중 방어).
3. 인증된 요청은 해당 라우트의 서버 컴포넌트(`layout.tsx` / `page.tsx`)가 Prisma로 PostgreSQL(Neon)을 조회한다. 이때 `src/lib/auth.ts`의 가시성 규칙(`folderVisibilityWhere`, `documentVisibilityWhere` 등)으로 사용자별로 보이는 데이터를 제한한다 (익명은 전체 차단).
4. 조회 결과를 클라이언트 컴포넌트에 props로 내려 화면을 렌더링한다.
5. 문서 작성/이동, 일정 추가, 블로그 발행 같은 사용자 액션은 Server Action(`src/lib/actions/*.ts`)이 처리한다. 모든 변경 액션은 진입부에서 세션 사용자를 자체 검증하고(비로그인 거부), 완료 후 `revalidatePath`로 관련 페이지 캐시를 무효화한다.

## 동작 파이프라인

### PDF 내보내기

```
블로그 글 상세 페이지에서 "PDF로 저장" 클릭
        │
        ▼
GET /api/blog/[slug]/pdf  (src/app/api/blog/[slug]/pdf/route.ts)
        │
        ▼
puppeteer-core + @sparticuz/chromium 으로 헤드리스 Chromium 실행
        │
        ▼
같은 서버의 /blog/[slug] 페이지를 요청 쿠키 그대로 들고 재방문 (print 미디어로 렌더링)
        │
        ▼
document.fonts.ready 대기 + 이미지가 페이지 경계에 걸리면 JS로 직접 높이 측정 후 축소/유지
        │
        ▼
Chromium page.pdf() 로 PDF 바이너리 생성
        │
        ▼
Content-Disposition: attachment 로 응답 → 브라우저가 다운로드
```

### 빌드 · 배포 (Vercel)

```
git push
   │
   ▼
Vercel 빌드 트리거 → npm run build
   │
   ├─ prisma migrate deploy   (DIRECT_URL, non-pooler 커넥션 사용)
   ├─ prisma generate         (src/generated/prisma 클라이언트 생성)
   └─ next build               (output: "standalone")
   │
   ▼
Vercel Serverless Functions로 배포
   (outputFileTracingIncludes로 @sparticuz/chromium 바이너리 + fonts/Pretendard*.ttf 함께 패키징)
```

## 기술 스택

- **프레임워크** — Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **스타일** — Tailwind CSS v4, `@tailwindcss/typography`, shadcn/ui(`base-ui` 기반 컴포넌트), framer-motion, lucide-react
- **데이터베이스** — PostgreSQL. 배포는 Neon serverless(`@prisma/adapter-neon`), 로컬은 일반 `pg` 드라이버(`@prisma/adapter-pg`)로 `src/lib/db.ts`에서 URL 패턴에 따라 분기
- **ORM** — Prisma 7 (`prisma.config.ts`, `schema.prisma`)
- **인증** — `iron-session` 쿠키 세션 + 4인 고정 PIN 로그인 (회원가입/소셜 로그인 없음)
- **문서/에디터** — `react-markdown` + `remark-gfm`/`remark-math` + `rehype-raw`/`rehype-sanitize`/`rehype-katex`, `shiki`(코드 하이라이팅), `katex`(수식)
- **드래그 앤 드롭** — `@dnd-kit/core` (위키 사이드바 파일/폴더 이동)
- **일정** — `react-big-calendar`, `date-fns`
- **차트** — `recharts` (타이머 통계)
- **파일 업로드** — `@vercel/blob`
- **PDF 생성** — `puppeteer-core` + `@sparticuz/chromium` (서버사이드 헤드리스 렌더링)
- **3D 배경** — `@react-three/fiber` + `three` + `simplex-noise` — 로그인 화면의 터레인 배경(`src/components/login/terrain-canvas.tsx`)에만 사용, 다른 화면에는 쓰이지 않음
- **데스크톱** — Electron + `electron-builder` (웹앱을 그대로 로드하는 셸, IPC로 네이티브 플로팅 창 제어)
- **배포** — Vercel (`output: "standalone"`)

## 프로젝트 구조

```
portpolio/
├── electron/                 # 데스크톱 셸 (자체 서버 없음, 배포 URL을 그대로 로드)
│   ├── main.js                #   메인 프로세스 — 메인 창 + 플로팅 타이머 창 생성
│   └── preload.js             #   contextBridge로 window.electronAPI 노출
├── fonts/                    # PDF 렌더링용 Pretendard TTF (Lambda에 한글 폰트가 없어서 직접 번들)
├── prisma/
│   ├── schema.prisma           # DB 모델 정의
│   ├── seed.ts                 # 초기 WorkspaceCategory 등 시드 스크립트
│   └── migrations/             # 마이그레이션 히스토리 (13개)
├── public/                   # 정적 파일 (manifest.json, doraemon.gif 등)
├── src/
│   ├── proxy.ts                # 인증 미들웨어 (iron-session 쿠키 검사)
│   ├── app/
│   │   ├── layout.tsx            # 루트 레이아웃 (Navbar, 테마, 타이머/검색 Provider)
│   │   ├── page.tsx              # 홈 대시보드
│   │   ├── login/                # PIN 로그인
│   │   ├── wiki/                 # 위키 (폴더/문서 트리 + 에디터)
│   │   ├── dev/, study/          # 구 라우트 — /wiki 로 리다이렉트만 함 (호환성 유지용)
│   │   ├── blog/                 # 공개 블로그 목록/상세
│   │   ├── calendar/             # 캘린더 + 할 일
│   │   ├── timer/                # 타이머 위젯 + float/ (팝업/Electron 플로팅 창용)
│   │   ├── about/                # 프로필 페이지
│   │   ├── search/                # 검색 결과 페이지
│   │   └── api/
│   │       ├── blog/[slug]/pdf/    # 블로그 글 → PDF 변환
│   │       └── upload/              # Vercel Blob 업로드
│   ├── components/
│   │   ├── wiki/, blog/, calendar/, timer/, dashboard/, about/, login/, search/, layout/
│   │   └── ui/                   # shadcn/ui 기반 공통 컴포넌트
│   ├── lib/
│   │   ├── actions/               # Server Actions (문서/폴더/일정/할 일/블로그/검색 등 변경 로직)
│   │   ├── server/auth.ts          # 세션에서 현재 사용자 조회
│   │   ├── auth.ts                  # 사용자 타입 + 가시성(visibility) 규칙
│   │   ├── db.ts                    # Prisma 클라이언트 (Neon/local 분기)
│   │   ├── session.ts               # iron-session 설정
│   │   ├── timer-channel.ts         # 타이머 BroadcastChannel 메시지 타입
│   │   └── (blog/calendar/wiki/stats/...).ts  # 도메인별 조회 로직
│   └── generated/prisma/         # `prisma generate` 산출물 (자동 생성, 직접 수정 금지)
├── CHANGELOG.md               # 작업 단위별 개발 기록
├── CLAUDE.md                  # 코드 작성 규칙 (응답 스타일, 아키텍처, 디자인 가이드)
└── .claude/commands/          # Claude Code 커맨드 (build/push/review/changelog/readme 등, git에는 추적 안 됨)
```

## 데이터 구조 (Prisma 스키마 핵심)

- `WorkspaceCategory` — 위키 카테고리(과거의 `dev`/`study` enum을 대체한 동적 카테고리). 색상(`color`)·정렬 순서를 가짐
- `Folder` — 카테고리에 속한 트리 구조(`parentId` 자기참조), `visibleTo`로 특정 사용자에게만 공개 가능
- `Document` — 위키 문서 본문(마크다운), `status`(`draft`/`done`/`review`), `tags`
- `BlogPost` — `Document`에서 발행된 공개 글. `documentId`/`folderId`는 nullable(원본 문서가 삭제/이동돼도 글은 유지)
- `Event` / `Todo` — 캘린더 일정과 할 일, `TaskWorkspace` enum(`dev`/`study`/`other`/`exercise`/`appointment`/`competition`/`exam`/`alba`)으로 라벨링
- `StudySession` — 타이머로 측정한 학습/작업 세션
- `LoginAttempt` — PIN 로그인 실패 기록. `identifier`에 IP 또는 `pin:xxxx` 키를 저장 — IP 키는 5회 실패 시 15분 잠금, PIN 키는 잠금 없이 응답 지연(백오프) 계산용
- `AboutProfile` — 사용자별 About 페이지 프로필(이름, 역할, 소개, 스킬, 링크)

## 통신 프로토콜 / API

| 종류 | 위치 | 형식 |
|---|---|---|
| PDF 내보내기 | `GET /api/blog/[slug]/pdf` | 응답: `application/pdf` 바이너리, `Content-Disposition: attachment` |
| 이미지 업로드 | `POST /api/upload` (multipart/form-data, `file` 필드) | 응답: `{ url: string }` (Vercel Blob public URL) |
| 타이머 실시간 동기화 | `BroadcastChannel("portpolio-timer")` (`src/lib/timer-channel.ts`) | `TimerStateMessage`(`STATE`, `sessionId` 포함)와 `TimerCommandMessage`(`START`/`PAUSE`/`RESUME`/`STOP`/`REQUEST_STATE`)를 같은 브라우저의 탭·플로팅 창(`/timer/float`) 사이에서 교환. 탭이 여러 개여도 Web Locks(`timer-owner`)로 선출된 리더 탭만 서버 액션을 실행하고, 나머지 탭은 커맨드를 채널로 위임 + 리더의 STATE를 채택 (중복 세션 방지, 리더 탭이 닫히면 다음 탭이 자동 승격) |
| Electron IPC | `electron/preload.js` → `window.electronAPI` | `openFloatTimer()` / `closeFloatTimer()` — 웹 페이지에서 네이티브 플로팅 창을 열고 닫음 (Electron이 아닐 때는 `window.electronAPI`가 없어서 일반 브라우저 팝업으로 대체) |

## 시작하기

### 요구 사항

- Node.js (LTS 권장, Next.js 16 기준 최신 LTS)
- PostgreSQL — Neon 같은 클라우드 인스턴스 또는 로컬 PostgreSQL

### 설치 및 실행

```bash
npm install
cp .env.example .env.local   # DATABASE_URL, DIRECT_URL, PIN_*, SESSION_SECRET 채우기
                              # (선택) TRUSTED_PROXY_COUNT — 기본 1(Vercel), 프록시 없는 자체 호스팅이면 0
npm run migrate                # 로컬 DB에 마이그레이션 적용 + 클라이언트 생성
npm run dev
```

### 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (`next dev`) |
| `npm run build` | `prisma migrate deploy` → `prisma generate` → `next build` (배포용) |
| `npm run start` | 빌드된 앱 실행 (`next start`) |
| `npm run migrate` | 로컬 개발용 마이그레이션 (`prisma migrate dev` + `generate`) |
| `npm run lint` | ESLint 실행 |
| `npm run electron` | 빌드된 Electron 앱 실행 |
| `npm run electron:dev` | `next dev`(3001 포트) + Electron 동시 실행 (데스크톱 셸 개발용) |
| `npm run electron:build` | `electron-builder`로 데스크톱 설치 파일 빌드 |

## 참고

- `public/manifest.json`이 `/icon-192.png`, `/icon-512.png`를 참조하지만 실제 `public/` 폴더에는 두 파일이 없다. PWA로 설치 시 아이콘이 깨질 수 있다 (확인 필요).
- `src/app/dev/`, `src/app/study/`는 기능 코드가 아니라 과거 URL(`/dev`, `/study`)을 새 통합 라우트 `/wiki`로 리다이렉트만 시켜주는 호환성 코드다.
- `electron/main.js`는 배포된 운영 URL(`https://portpolio-beta-mocha.vercel.app`)을 코드에 직접 하드코딩하고 있다. 배포 도메인이 바뀌면 이 파일도 같이 수정해야 한다.
- `src/app/api/blog/[slug]/pdf/route.ts`의 `console.log("[pdf-debug] ...")`는 `NODE_ENV !== "production"` 가드로 개발 환경에서만 출력된다 (자세한 배경은 `CHANGELOG.md` 참고).
- `src/app/about/page.tsx`의 `DEFAULTS`는 실제 정보가 아닌 placeholder(`your-id`, `you@example.com` 등)이며, `AboutProfile` 테이블에 데이터가 없을 때만 보여주는 초기값이다. 관리자가 화면에서 직접 편집하면 DB에 저장된다.
- `package.json`에는 Next.js 웹 앱 진입점 외에 Electron 데스크톱 진입점(`"main": "electron/main.js"`)이 같이 정의되어 있다. 실제 배포(Vercel)는 Next.js 빌드만 사용하고, Electron 빌드는 별도 로컬/수동 작업이다.
- `.claude/commands/`는 `.gitignore`에 등록되어 있어 원격 저장소에는 올라가지 않는, 로컬 전용 Claude Code 작업 설정이다.
