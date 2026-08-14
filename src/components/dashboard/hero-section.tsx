import { LiveClock } from "./live-clock";
import type { User } from "@/lib/auth";

const GREETING: Record<NonNullable<User>, string> = {
  taewoo: "안녕하세요, 태우님 👋",
  yujin: "안녕하세요, 유진님 👋",
  hoyoung: "안녕하세요, 호영님 👋",
  donghyun: "안녕하세요, 동현님 👋",
};

export function HeroSection({ user }: { user: User | null }) {
  const greeting = user ? GREETING[user] : "안녕하세요 👋";

  return (
    <div className="rounded-2xl bg-primary px-8 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">{greeting}</h1>
          <p className="mt-1 text-sm text-primary-foreground/70">오늘도 좋은 하루 보내세요.</p>
        </div>
        <LiveClock />
      </div>
    </div>
  );
}
