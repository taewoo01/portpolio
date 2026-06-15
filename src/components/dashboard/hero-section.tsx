import { LiveClock } from "./live-clock";
import type { User } from "@/lib/auth";

const GREETING: Record<NonNullable<User>, string> = {
  taewoo: "안녕하세요, 태우님 👋",
  yujin: "안녕하세요, 유진님 👋",
};

export function HeroSection({ user }: { user: User | null }) {
  const greeting = user ? GREETING[user] : "안녕하세요 👋";

  return (
    <div className="aurora-bg relative overflow-hidden rounded-2xl px-8 py-10 shadow-md">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}</h1>
          <p className="mt-1 text-sm text-white/50">오늘도 좋은 하루 보내세요.</p>
        </div>
        <LiveClock />
      </div>
    </div>
  );
}
