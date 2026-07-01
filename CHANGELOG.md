# 2026.06.29 개발 기록

### 1. 로그인 — 클라이언트가 조작 가능한 IP로 잠금이 무력화됨

### 기존 문제
`loginAction`의 잠금 식별자가 `x-forwarded-for` 헤더의 첫 번째 값 하나뿐이었다. 이 헤더는 클라이언트가 직접 보낼 수 있는 값이라, 요청마다 헤더를 바꿔 보내면 식별자가 매번 달라져 `MAX_ATTEMPTS=5` / 15분 잠금이 무력화됐다. 또한 식별자가 IP 하나뿐이라 여러 IP에 분산해서 시도하면 같은 PIN에 대한 무차별 대입도 막을 방법이 없었다.

```typescript
// 문제 상황 — src/lib/actions/auth.ts
async function getClientIp(): Promise<string> {
  const store = await headers();
  return store.get("x-forwarded-for")?.split(",")[0].trim() ?? store.get("x-real-ip") ?? "unknown";
}
```

### 해결 방법
`x-forwarded-for`는 `클라이언트IP, 프록시1, 프록시2 ...` 순으로 각 홉이 앞에 누적되는 헤더라, 클라이언트가 조작 가능한 값은 항상 맨 앞이고 신뢰할 수 있는 마지막 hop 값은 체인의 마지막이다. `split(",")[0]` 대신 마지막 값을 쓰도록 바꿨다.

```typescript
// 기존
async function getClientIp(): Promise<string> {
  const store = await headers();
  return store.get("x-forwarded-for")?.split(",")[0].trim() ?? store.get("x-real-ip") ?? "unknown";
}

// 변경 후
async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1];
  }
  return store.get("x-real-ip") ?? "unknown";
}
```

IP만으로는 분산 시도를 막을 수 없으므로, 시도한 PIN 값 자체(`pin:${pin}`)도 별도 식별자로 두고 동일하게 5회/15분 잠금을 적용했다. 로그인 성공 시 IP·PIN 두 식별자 모두 초기화한다.

```typescript
// 추가: PIN 단위 잠금
export async function loginAction(pin: string): Promise<string | null> {
  const ip = await getClientIp();
  const pinKey = `pin:${pin}`;

  const [ipAttempt, pinAttempt] = await Promise.all([
    prisma.loginAttempt.findUnique({ where: { identifier: ip } }),
    prisma.loginAttempt.findUnique({ where: { identifier: pinKey } }),
  ]);

  const locked = [ipAttempt, pinAttempt].find(isLocked);
  if (locked?.lockedUntil) {
    const minutes = Math.ceil((locked.lockedUntil.getTime() - Date.now()) / 60000);
    return `너무 많은 시도가 감지되었습니다. ${minutes}분 후 다시 시도하세요.`;
  }
  // ...
}
```

---

### 2. 일정/할 일 — 소유자 검증 없이 수정·삭제 가능 (IDOR)

### 기존 문제
`updateEventAction`/`deleteEventAction`(`events.ts`), `updateTodoAction`/`deleteTodoAction`/`toggleTodoCompleteAction`(`todos.ts`)이 id만으로 바로 `prisma.event`/`prisma.todo`의 update·delete를 호출했다. `documents.ts`의 동급 액션들은 `getUser()` + `isOwner(currentUser, existing.createdBy ?? null)` 체크를 거치는데 이 패턴이 빠져 있었다. 클라이언트(`todo-list.tsx`)는 `isOwner`로 삭제 버튼을 UI에서만 숨기고 있어, 서버 액션을 직접 호출하면(다른 사용자의 eventId/todoId를 알면) 우회되어 누구나 수정·삭제·완료 토글이 가능했다.

### 해결 방법
`documents.ts`와 동일하게, 각 액션 진입 시 `findFirst`로 대상의 `createdBy`를 조회하고 `isOwner` 체크를 통과해야만 실제 update/delete를 수행하도록 했다.

```typescript
// 추가 — events.ts / todos.ts 각 update/delete/toggle 액션 공통
const currentUser = await getUser();
const existing = await prisma.event.findFirst({ // todo.findFirst도 동일
  where: { id: eventId },
  select: { createdBy: true },
});
if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };
```

대상이 존재하지 않는 경우는 그대로 통과시켜 이후 `update`/`delete`가 "Record not found"로 실패하고 기존 catch 블록의 에러 메시지로 처리되도록 했다(`documents.ts`와 동일한 동작). `createEventAction`/`createTodoAction`은 신규 생성이라 검증 대상에서 제외했다.

---

### 3. 업로드 API — 인증·타입·크기 검증 없이 공개 업로드 가능

### 기존 문제
`/api/upload`에 `getUser()` 호출이 없고 프로젝트 전체에 `middleware.ts`가 없어, 로그인 여부와 무관하게 누구나 직접 POST할 수 있었다. MIME 화이트리스트나 파일 크기 제한도 없어 임의 크기/타입 파일을 `access: "public"`으로 업로드할 수 있었고, 업로드 경로(`pathname`)로 클라이언트가 보낸 `file.name`을 그대로 사용했다.

```typescript
// 문제 상황 — src/app/api/upload/route.ts
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const blob = await put(file.name, file, { access: "public" });
  return NextResponse.json({ url: blob.url });
}
```

### 해결 방법
`getUser()`로 세션을 확인해 비로그인 요청을 401로 차단하고, 이미지 MIME 화이트리스트와 5MB 크기 제한을 추가했다. 업로드 경로는 클라이언트가 보낸 파일명 대신 검증된 MIME에서 도출한 확장자로 서버가 직접 생성한다(SVG는 XSS 위험으로 화이트리스트에서 제외).

```typescript
// 변경 후 — src/app/api/upload/route.ts
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const currentUser = await getUser();
  if (!currentUser) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "허용되지 않는 파일 형식입니다." }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "파일 크기는 5MB를 초과할 수 없습니다." }, { status: 400 });
  }

  const blob = await put(`uploads/${randomUUID()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });
  return NextResponse.json({ url: blob.url });
}
```

---

### 4. 소개 페이지 — 이메일을 `mailto:` 없이 입력하면 깨진 링크가 됨

### 기존 문제
`saveAboutProfileAction`이 `links` 배열을 검증·가공 없이 그대로 저장했다. 에디터의 링크 href 입력은 자유 텍스트라서, 이메일 주소를 `mailto:` 없이 입력하면(`you@example.com`) 그 형태로 그대로 저장되어 클릭 시 동작하지 않는 깨진 링크가 됐다.

### 해결 방법
저장 시점에 `href`가 이메일 패턴과 일치하면 `mailto:`를 붙이도록 정규화했다. 이미 스킴이 붙은 값(`mailto:...`, `http://...`)이나 경로(`/blog`)를 다시 매칭하지 않도록 `@`/공백/`:`/`/`를 제외하는 패턴을 썼다.

```typescript
// 추가 — src/lib/actions/about.ts
const EMAIL_PATTERN = /^[^\s@:/]+@[^\s@]+\.[^\s@]+$/;

function normalizeLinks(links: SiteLink[]): SiteLink[] {
  return links.map((link) =>
    EMAIL_PATTERN.test(link.href) ? { ...link, href: `mailto:${link.href}` } : link
  );
}
```

```typescript
// 기존
await prisma.aboutProfile.upsert({
  where: { owner },
  create: { owner, ...data, links: data.links },
  update: { ...data, links: data.links },
});

// 변경 후
const links = normalizeLinks(data.links);

await prisma.aboutProfile.upsert({
  where: { owner },
  create: { owner, ...data, links },
  update: { ...data, links },
});
```

---

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
