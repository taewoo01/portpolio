# 2026.06.28 ~ 06.29 개발 기록

### 1. 위키 — GitHub README 가져오기 개선

### 기존 문제
위키에서 GitHub README를 가져와 문서를 작성할 수 있었지만, GitHub에서 보던 것과 다르게 깨져서 들어왔다. 이미지는 안 보이고, 배지(shields.io) 같은 raw HTML은 코드 텍스트로 그대로 노출됐다.

```md
<!-- README 원본 -->
![logo](./assets/logo.png)
<img src="https://img.shields.io/badge/...">
```

원인은 두 가지였다.
1. README 안의 이미지/링크가 **저장소 기준 상대경로**라서, 위키로 가져오면 깨진 링크가 됨
2. 마크다운 렌더러가 raw HTML을 그대로 텍스트로 출력 (HTML 파싱 단계 자체가 없었음)

### 해결 방법
**상대경로 → 절대경로 변환** (`document-editor.tsx`)

import 시점에 README 안의 상대경로를 `raw.githubusercontent.com` / `github.com/.../blob` 절대 URL로 치환했다.

```typescript
// 추가: resolveAgainst / rewriteGitHubUrls
onImport(rewriteGitHubUrls(markdown, data));
```

**raw HTML 렌더링 추가** (`markdown-preview.tsx`)

```typescript
// 기존
rehypePlugins={[rehypeKatex]}

// 변경 후
rehypePlugins={[rehypeRaw, [rehypeSanitize, defaultSchema], rehypeKatex]}
```
순서가 중요했다 — raw HTML을 먼저 파싱(`rehypeRaw`)하고, 그다음 위험한 태그/속성을 걷어내야(`rehypeSanitize`) 안전하면서도 정상적으로 렌더링된다.

**배지 아이콘이 세로로 쌓이는 문제**

Tailwind Preflight의 전역 리셋(`img { display: block }`) 때문에 한 줄에 나란히 있어야 할 배지 이미지들이 각자 줄바꿈되어 쌓였다. `prose-img:inline-block` 클래스를 추가해 해결했다.

---

### 2. 블로그 — 이미지 라이트박스

### 기존 문제
블로그 글 본문의 이미지를 클릭해도 아무 반응이 없었다. 원본 크기로 확인하려면 별도로 이미지를 새 탭에 열어야 했다.

### 해결 방법
`markdown-preview.tsx`에 `lightbox` prop을 추가하고, 클릭 시 확대 오버레이(ESC/배경 클릭으로 닫힘)를 보여주는 `ImageLightbox` 컴포넌트를 만들었다. 위키 프리뷰에는 영향이 없도록 블로그 페이지에서만 켜도록 분리했다.

```typescript
// src/app/blog/[slug]/page.tsx
<MarkdownPreview content={post.content} lightbox />
```

---

### 3. 블로그 — 폴더 그룹핑 + 더보기 페이지네이션

### 기존 문제
블로그 글이 카테고리 안에서 시간순으로만 나열되어, 글이 쌓일수록 스크롤이 끝없이 길어지는 느낌이 들었다. 위키는 폴더 구조가 있는데 블로그는 그 구조가 전혀 반영되지 않았다.

### 해결 방법
**폴더 그룹핑**

위키 문서가 발행될 때 갖고 있던 폴더 정보(`folderId`)를 블로그 글에도 반영해서, 카테고리 내부를 위키처럼 폴더 단위로 묶어 보여주도록 했다.

```typescript
// prisma/schema.prisma
model BlogPost {
  folderId String? @map("folder_id")
  folder   Folder? @relation(...)
}
```

폴더 목록(`foldersInCategory`)은 실제 글 데이터에서 파생시켜 만들었다. 빈 폴더까지 DB에서 직접 조회하면 비공개 폴더 이름이 노출될 수 있기 때문이다.

**더보기 페이지네이션** (`blog-list.tsx`)

```typescript
const PAGE_SIZE = 15;
const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
```
필터/폴더/정렬을 바꿀 때마다 `visibleCount`를 `PAGE_SIZE`로 리셋하고, "더보기" 버튼을 누르면 늘어나는 방식으로 구현했다.

---

### 4. 위키 — 드래그 앤 드롭으로 파일/폴더 이동

### 기존 문제
파일이나 폴더의 위치를 바꾸려면 마땅한 이동 수단이 없었다. 폴더 구조를 정리하려면 사실상 새로 만들고 옮기는 수밖에 없었다.

### 해결 방법
`@dnd-kit/core`로 사이드바에 드래그 앤 드롭을 구현했다 (`folder-sidebar.tsx`). 카테고리가 다르면 데이터 구조상 의미가 달라지므로, **같은 카테고리 내에서만** 이동을 허용했다.

구현 중 만난 버그 두 가지:
- **자기 자신과의 충돌**: 폴더가 draggable이면서 동시에 droppable이라, 자기 위에 드롭되는 충돌이 발생 → 자신의 droppable에 `disabled: isDragging` 적용
- **드래그 중 레이아웃 흔들림**: 드롭 영역이 조건부로 마운트/언마운트되면서 dnd-kit의 좌표 계산이 틀어짐 → 항상 마운트된 채 위치만 절대좌표로 토글하는 `RootDropZone`으로 교체

**블로그 동기화**

문서를 새 폴더로 옮겼을 때, 이미 발행된 블로그 글이 있다면 재발행 없이 폴더 위치도 같이 갱신되도록 했다 (`moveDocumentAction`).

```typescript
const post = await prisma.blogPost.findFirst({ where: { documentId }, select: { id: true, slug: true } });
if (post) {
  await prisma.blogPost.update({ where: { id: post.id }, data: { folderId: targetFolderId } });
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
}
```

---

### 5. 블로그 — 서버사이드 PDF 내보내기

### 기존 문제
PDF 내보내기가 브라우저 `window.print()`에 의존하고 있어서, 이미지가 페이지 경계에 걸리면 빈 공간을 남기고 다음 페이지로 밀려버렸다. CSS `break-inside`만으로는 한계가 있었다.

### 해결 방법
`puppeteer-core` + `@sparticuz/chromium`으로 서버에서 직접 헤드리스 브라우저를 띄워 PDF를 생성하는 방식(`/api/blog/[slug]/pdf`)으로 완전히 교체했다.

```typescript
const browser = await puppeteer.launch({
  args: puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
  executablePath: isLocal ? process.env.CHROME_EXECUTABLE_PATH : await chromium.executablePath(),
});
```

로컬에서는 동작하는데 실제 Vercel 배포본에서만 실패하는 문제가 이어져서, 로그를 기반으로 하나씩 추적해 수정했다.

**바이너리가 배포 번들에서 빠지는 문제**

`outputFileTracingIncludes`에 `/api/blog/[slug]/pdf` 키를 그대로 썼는데, `[slug]`가 picomatch에서 문자 클래스로 해석되어 매칭이 안 됐다.

```typescript
// 기존 (매칭 안 됨)
outputFileTracingIncludes: { "/api/blog/[slug]/pdf": [...] }

// 변경 후
outputFileTracingIncludes: { "/api/blog/*/pdf": [...] }
```

**한글 폰트 깨짐**

Lambda의 Chromium에는 한글 폰트가 없어서 텍스트가 빈 사각형으로 나왔다. Pretendard TTF를 저장소에 직접 포함해 같은 방식으로 트레이싱했다.

**이미지가 페이지 경계에서 밀리는 문제**

처음엔 "남은 공간 대비 이미지 높이" 비율로 줄일지/넘길지 판단했는데, 실제 운영 로그를 확인해보니 `remaining(500.88px)`이 `naturalHeight * 0.5(510.47px)`보다 딱 9.6px 부족해서 비율 경계에 걸려 매번 잘못된 분기를 타고 있었다. subpixel 단위로 흔들리는 비율 비교 대신, 절대값 기준으로 교체해서 안정화했다.

```typescript
// 기존: 비율 기반 (subpixel 차이에 취약)
if (shrunkHeight >= naturalHeight * 0.5) { ... }

// 변경 후: 절대값 기준
const MIN_USEFUL_HEIGHT_PX = 150;
if (shrunkHeight >= MIN_USEFUL_HEIGHT_PX) { ... }
```

### 현재 남은 문제
이 과정에서 추가한 진단용 로그(`console.log("[pdf-debug] ...")`, `route.ts` 50번째/107번째 줄)가 아직 코드에 남아 있다. 운영 로그가 더 필요할 수도 있어 일단 유지 중인데, 안정성이 충분히 확인되면 제거가 필요하다.

---

### 6. 위키 사이드바 — 들여쓰기 정렬

### 기존 문제
같은 폴더 안에 하위 폴더와 문서가 함께 있을 때, 문서 쪽이 폴더보다 더 안쪽으로 들여써져서 같은 깊이인데도 시작 위치가 어긋나 보였다.

### 해결 방법
폴더와 문서 항목의 들여쓰기 계산식이 서로 달랐던 것이 원인이었다. 같은 공식으로 통일했다 (`folder-sidebar.tsx`).

```typescript
// 기존
style={{ paddingLeft: `${depth * 16 + 28}px` }}   // 문서
style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}  // "새 문서" placeholder

// 변경 후
style={{ paddingLeft: `${depth * 16 + 4}px` }}
style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}
```

---

### 7. 위키 — 문서 전환 시 전체 리로딩처럼 보이는 문제

### 기존 문제
위키에서 문서를 클릭하면 사이드바를 포함한 화면 전체가 다시 그려지는 느낌이 들었다. 실제로 풀 리로딩인지, 그렇게 "느껴지기만" 하는 것인지부터 확인이 필요했다.

### 원인 분석
합성 테스트 라우트를 따로 만들어 네트워크 요청과 컴포넌트 마운트 시점을 직접 측정했다. 결과:
- 네트워크 요청은 RSC 데이터(`?_rsc=...`)만 오는 **소프트 내비게이션**이었고, 풀 HTML 리로드는 아니었음
- 레이아웃의 서버 쪽 연산(DB 조회 등)은 캐시되어 재실행되지 않았음
- 그런데도 사이드바를 감싸는 **클라이언트 컴포넌트는 매번 unmount → remount** 되고 있었음

원인은 루트 레이아웃(`src/app/layout.tsx`)의 페이지 전환 애니메이션 컴포넌트였다.

```typescript
// src/components/layout/page-transition.tsx (기존)
<motion.div key={pathname} ...>{children}</motion.div>
```
`key`가 전체 경로(pathname)였기 때문에, 같은 섹션 안에서 문서만 바뀌어도(`/wiki/문서1` → `/wiki/문서2`) key가 바뀌어 React가 그 아래 전체를 새 트리로 취급해 사이드바까지 통째로 다시 마운트하고 있었다.

### 해결 방법
```typescript
// 변경 후
const sectionKey = pathname.split("/")[1] ?? "";
<motion.div key={sectionKey} ...>{children}</motion.div>
```
key를 경로 최상위 세그먼트로 좁혔다. 같은 섹션(`/wiki`, `/dev`, `/study` 등) 안에서의 이동은 더 이상 리마운트되지 않고, 섹션 간 이동(`/wiki` ↔ `/blog` 등)에서는 전환 애니메이션이 그대로 동작한다.

---

## 이 기간 진행된 DB 마이그레이션

| 마이그레이션 | 내용 |
|---|---|
| `20260628120000_add_blog_post_folder` | `BlogPost`에 `folder_id` 컬럼 + FK 추가 (블로그 폴더 그룹핑용) |
