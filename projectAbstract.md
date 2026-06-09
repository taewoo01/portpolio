# portpolio — 프로젝트 컨텍스트

이 문서는 AI 어시스턴트가 이 프로젝트의 목적, 구조, 기술 스택, 규칙을 빠르게 파악하도록 작성된 컨텍스트 파일이다.

---

## 한 줄 요약

**Notion처럼 문서를 정리하고, 일정을 관리하고, 필요 시 블로그로 공개하는 개인 지식 허브 + 홈페이지.**

- 개발자 본인만 사용 (로그인/인증 없음)
- **개발** 관련 노트와 **개인 공부** 노트를 메뉴·데이터에서 분리
- 로컬 PostgreSQL에 저장, Next.js로 구현

---

## 프로젝트 목적

| 목표 | 설명 |
|------|------|
| 문서 정리 | 공부·개발 내용을 폴더 + 문서 형태로 저장 (Notion 스타일) |
| 영역 분리 | 개발(projects, tech stack)과 개인 공부(courses, books, CS)를 분리해 조회 |
| 일정 관리 | 월간 캘린더 + 할 일로 학습·작업 계획 관리 |
| 블로그 | 정리한 문서 중 공유할 내용만 공개 발행 |
| 포트폴리오 | About 페이지로 자기소개·링크 제공 |

---

## 포함하지 않는 것

- 로그인 / 인증 (NextAuth 등) — 나만 쓰므로 제외
- 버스 노선, 지도 API — 이 프로젝트와 무관 (과거 오해로 제안됐던 항목)
- Notion API 연동 — 자체 Wiki를 직접 구현
- MySQL — PostgreSQL만 사용

---

## 기술 스택

| 구분 | 선택 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| DB | 로컬 PostgreSQL |
| DB 관리 | pgAdmin4 |
| ORM | Prisma |
| 스타일 | Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |
| 문서 에디터 | 마크다운 우선 (추후 Tiptap 등 리치 에디터 선택) |
| 일정 UI | react-big-calendar 또는 FullCalendar |

### 환경 변수

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/portpolio"
```

---

## 정보 구조 (상단 메뉴)

```
홈 | 개발 | 공부 | 일정 | 블로그 | About     🔍
```

| 메뉴 | URL | 역할 |
|------|-----|------|
| 홈 | `/` | 대시보드 — 오늘 일정, 최근 문서, 진행 중 항목 |
| 개발 | `/dev` | 프로젝트·기술·트러블슈팅 등 개발 관련 문서 |
| 공부 | `/study` | 강의·책·CS·자격증 등 개인 학습 문서 |
| 일정 | `/calendar` | 월간 캘린더 + 할 일 |
| 블로그 | `/blog` | 공개 글 목록 |
| About | `/about` | 소개, 스킬, 링크, 연락처 |
| 검색 | `/search` 또는 `Ctrl+K` | 제목·본문 통합 검색 (전체 / 개발 / 공부 필터) |

---

## 화면 레이아웃 (개발·공부 공통)

```
┌──────────────────────────────────────────────────────────┐
│  로고   홈  개발  공부  일정  블로그  About      🔍       │
├─────────────┬────────────────────────────────────────────┤
│  폴더 트리    │  문서 제목                                  │
│  (사이드바)   │  ─────────────────────────────────────     │
│             │  마크다운 / 리치 에디터                     │
│             │  태그 · 상태 · 수정일 · [블로그 발행]        │
└─────────────┴────────────────────────────────────────────┘
```

- 상단바: 큰 영역(메뉴) 이동
- 왼쪽 사이드바: 해당 workspace 안의 폴더·페이지 트리
- 본문: 문서 읽기·작성

---

## Workspace 분리

개발과 공부는 **같은 UI, 다른 workspace** 로 분리한다.

| workspace | 메뉴 | 용도 |
|-----------|------|------|
| `dev` | 개발 | 프로젝트, 기술 스택, 트러블슈팅, 스니펫, 설계 메모 |
| `study` | 공부 | 진행 중 학습, CS, 알고리즘, 강의, 책, 자격증 |

### 폴더 예시 — 개발 (`dev`)

```
프로젝트 / 기술 스택 / 트러블슈팅 / 스니펫 / 설계·아키텍처
```

### 폴더 예시 — 공부 (`study`)

```
진행 중 / CS 기초 / 알고리즘 / 강의·강좌 / 책 / 자격증·시험 / 기타
```

---

## 핵심 기능

1. **문서 작성** — 마크다운 (추후 리치 에디터)
2. **폴더·페이지 트리** — 왼쪽 사이드바, parent-child 구조
3. **검색** — 제목·본문, workspace 필터 (전체 / dev / study)
4. **일정** — 월간 캘린더 + 할 일, workspace 라벨 (dev / study / other)
5. **블로그 발행** — wiki 문서에서 공개 글로 승격

---

## 문서 메타데이터

| 필드 | 설명 |
|------|------|
| `workspace` | `dev` \| `study` |
| `title` | 제목 |
| `content` | 본문 (마크다운) |
| `status` | `draft` (작성 중) \| `done` (정리 완료) \| `review` (복습 필요) |
| `tags` | 문자열 배열 |
| `folder_id` | 소속 폴더 |
| `updated_at` | 최근 수정일 (정렬·홈 대시보드용) |

---

## URL 구조

```
/                          홈 (대시보드)
/about                     소개

/dev                       개발 문서 (트리 + 목록)
/dev/[documentId]          개발 문서 상세·편집

/study                     공부 문서
/study/[documentId]        공부 문서 상세·편집

/calendar                  일정 + 할 일

/blog                      공개 글 목록
/blog/[slug]               공개 글 상세

/search?q=...&workspace=   검색
```

---

## 홈 대시보드 (`/`)

- 오늘 일정·할 일 요약 (workspace별 라벨)
- 최근 수정 문서 (dev / study 탭)
- 진행 중 문서 (`draft`, `review` 상태)
- (선택) 마감·시험 D-day

문서 작성은 여기서 하지 않고 요약만 표시한다.

---

## 블로그 흐름

1. `/dev` 또는 `/study`에서 문서 작성·정리
2. 「블로그로 발행」 클릭
3. `/blog/[slug]`에 공개, 카테고리 Dev / Study
4. 원본 wiki 문서는 그대로 유지

---

## DB 스키마 (PostgreSQL)

### `folders`

```
id, parent_id (nullable, self-ref), workspace ('dev'|'study'),
name, sort_order, created_at, updated_at
```

### `documents`

```
id, folder_id, workspace, title, content (TEXT),
status ('draft'|'done'|'review'), tags (TEXT[] 또는 JSONB),
created_at, updated_at
```

### `events`

```
id, title, description, start_at, end_at,
workspace ('dev'|'study'|'other'), all_day (boolean),
created_at, updated_at
```

### `todos`

```
id, title, completed (boolean), due_date (nullable),
workspace ('dev'|'study'|'other'), event_id (nullable),
sort_order, created_at, updated_at
```

### `blog_posts`

```
id, document_id (nullable), workspace, title, slug (unique),
content, excerpt (nullable), published (boolean), published_at,
created_at, updated_at
```

### 검색 (추후)

PostgreSQL `tsvector` + GIN 인덱스로 전문 검색. 초기에는 `ILIKE` 또는 Prisma `contains`로 시작 가능.

---

## 프로젝트 폴더 구조 (목표)

```
portpolio/
├── CLAUDE.md                 # 이 파일
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx        # 상단바 공통
│   │   ├── page.tsx          # 홈
│   │   ├── about/
│   │   ├── dev/
│   │   │   ├── layout.tsx    # 사이드바 + 본문
│   │   │   ├── page.tsx
│   │   │   └── [documentId]/
│   │   ├── study/            # dev와 동일 구조
│   │   ├── calendar/
│   │   ├── blog/
│   │   ├── search/
│   │   └── api/              # API routes 또는 Server Actions
│   ├── components/
│   │   ├── layout/           # Navbar, Sidebar
│   │   ├── editor/           # MarkdownEditor
│   │   ├── calendar/
│   │   └── search/           # CommandPalette (Ctrl+K)
│   └── lib/
│       └── db.ts             # Prisma client
├── .env
└── package.json
```

---

## 개발 단계 (우선순위)

| 단계 | 내용 |
|------|------|
| 1 | Next.js + PostgreSQL + Prisma + pgAdmin4 연결 |
| 2 | 상단바 + 레이아웃 + About + 홈(빈 대시보드) |
| 3 | folders + documents CRUD, dev/study 분리, 사이드바 트리 |
| 4 | 마크다운 에디터 + 상태·태그 |
| 5 | 검색 (제목·본문, workspace 필터) |
| 6 | events + todos + 캘린더 UI, 홈 연동 |
| 7 | 블로그 발행 + `/blog` |
| 8 | (선택) 리치 에디터, 전문 검색, 통계, 다크모드 |

3단계까지 완료되면 일상적으로 사용 가능한 수준이다.

---

## 코딩 규칙 (AI 참고)

- **최소 범위 변경**: 요청과 무관한 코드 수정 금지
- **기존 컨벤션 따르기**: 파일·폴더 구조, 네이밍 일관성 유지
- **과도한 추상화 금지**: 단순한 문제에 단순한 해결
- **인증 추가하지 않기**: 사용자가 명시적으로 요청하기 전까지 로그인/인증 도입 금지
- **PostgreSQL만 사용**: MySQL, Supabase 등 다른 DB로 변경하지 않기 (사용자가 요청할 때만)
- **dev / study 분리 유지**: 문서·폴더·일정에 workspace 필드로 영역 구분
- **주석**: 비즈니스 로직이 불명확할 때만 추가

---

## 배포 참고 (나중에)

- 현재는 로컬 전용 (`localhost`) 가정
- 인터넷 배포 시 wiki·일정이 공개될 수 있음 — 그때 인증 또는 비공개 호스팅 검토
- 배포 DB는 PostgreSQL 계열(Supabase, Neon 등)로 이전 가능하도록 스키마 유지
