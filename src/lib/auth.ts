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
  if (!createdBy) return true;
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
  if (!createdBy) return true;
  return !hiddenUsersFor(currentUser).includes(createdBy as User);
}

export function visibilityWhere(currentUser: User | null) {
  const hidden = hiddenUsersFor(currentUser);
  if (hidden.length === 0) return undefined;
  return { OR: [{ createdBy: null }, { createdBy: { notIn: hidden } }] };
}

export function folderVisibilityWhere(currentUser: User | null) {
  if (currentUser === "taewoo") return undefined;
  return {
    OR: [
      { createdBy: currentUser },
      { createdBy: null },
      { visibleTo: { isEmpty: true } },
      ...(currentUser ? [{ visibleTo: { has: currentUser } }] : []),
    ],
  };
}
