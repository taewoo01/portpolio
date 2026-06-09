export type User = "taewoo" | "yujin";

export const USER_LABEL: Record<User, string> = {
  taewoo: "태우님",
  yujin: "유진님",
};

export function isOwner(currentUser: User | null, createdBy: string | null): boolean {
  if (!createdBy) return true;
  return currentUser === createdBy;
}
