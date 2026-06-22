export type User = "taewoo" | "yujin" | "hoyoung";

export const ALL_USERS: User[] = ["taewoo", "yujin", "hoyoung"];

export const USER_LABEL: Record<User, string> = {
  taewoo: "태우님",
  yujin: "유진님",
  hoyoung: "호영님",
};

export const USER_INITIAL: Record<User, string> = {
  taewoo: "T",
  yujin: "Y",
  hoyoung: "H",
};

export function isOwner(currentUser: User | null, createdBy: string | null): boolean {
  if (!createdBy) return true;
  return currentUser === createdBy;
}

// 서로의 일정/위키/블로그를 볼 수 없는 유저 쌍
const PRIVATE_PAIRS: [User, User][] = [["yujin", "hoyoung"]];

export function hiddenUsersFor(currentUser: User | null): User[] {
  if (!currentUser) return [];
  const pair = PRIVATE_PAIRS.find((p) => p.includes(currentUser));
  return pair ? pair.filter((u) => u !== currentUser) : [];
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
