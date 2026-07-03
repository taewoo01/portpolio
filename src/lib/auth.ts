export type User = "taewoo" | "yujin" | "hoyoung" | "donghyun";

export const ALL_USERS: User[] = ["taewoo", "yujin", "hoyoung", "donghyun"];

export const USER_LABEL: Record<User, string> = {
  taewoo: "태우님",
  yujin: "유진님",
  hoyoung: "호영님",
  donghyun: "동현님",
};

export const USER_INITIAL: Record<User, string> = {
  taewoo: "T",
  yujin: "Y",
  hoyoung: "H",
  donghyun: "D",
};

export function isOwner(currentUser: User | null, createdBy: string | null): boolean {
  if (currentUser === "taewoo") return true;
  // 소유자 없는 레거시 레코드는 공개 읽기 전용 — 쓰기는 관리자(taewoo)만 가능
  if (!createdBy) return false;
  return currentUser === createdBy;
}

// 서로의 일정/위키/블로그를 볼 수 없는 유저 쌍
const PRIVATE_PAIRS: [User, User][] = [
  ["yujin", "hoyoung"],
  ["yujin", "donghyun"],
];

export function hiddenUsersFor(currentUser: User | null): User[] {
  if (!currentUser) return [];
  return PRIVATE_PAIRS
    .filter((p) => p.includes(currentUser))
    .flatMap((p) => p.filter((u) => u !== currentUser));
}

export function canView(currentUser: User | null, createdBy: string | null): boolean {
  // 익명(비로그인)은 아무것도 볼 수 없다 — 미들웨어 우회 시 2차 방어
  if (!currentUser) return false;
  if (!createdBy) return true;
  return !hiddenUsersFor(currentUser).includes(createdBy as User);
}

export function visibilityWhere(currentUser: User | null) {
  // 익명은 전체 차단 (어떤 행과도 매칭되지 않는 조건)
  if (!currentUser) return { createdBy: { in: [] } };
  const hidden = hiddenUsersFor(currentUser);
  if (hidden.length === 0) return undefined;
  return { OR: [{ createdBy: null }, { createdBy: { notIn: hidden } }] };
}

export function folderVisibilityWhere(currentUser: User | null) {
  if (!currentUser) return { id: { in: [] } };
  if (currentUser === "taewoo") return undefined;
  return {
    OR: [
      { createdBy: currentUser },
      { createdBy: null },
      { visibleTo: { isEmpty: true } },
      { visibleTo: { has: currentUser } },
    ],
  };
}

export function documentVisibilityWhere(currentUser: User | null) {
  if (!currentUser) return { id: { in: [] } };
  if (currentUser === "taewoo") return undefined;
  // PRIVATE_PAIRS(문서 createdBy) 필터는 폴더 위치와 무관하게 항상 적용,
  // 폴더 가시성(visibleTo)은 위치 조건으로 AND 결합
  return {
    AND: [
      visibilityWhere(currentUser) ?? {},
      { OR: [{ folderId: null }, { folder: folderVisibilityWhere(currentUser) }] },
    ],
  };
}
