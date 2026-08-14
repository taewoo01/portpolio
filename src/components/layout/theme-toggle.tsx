"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const ORDER = ["light", "dark", "system"] as const;
const LABEL: Record<(typeof ORDER)[number], string> = {
  light: "라이트 모드",
  dark: "다크 모드",
  system: "시스템 설정",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function cycleTheme() {
    const current = ORDER.includes(theme as (typeof ORDER)[number])
      ? (theme as (typeof ORDER)[number])
      : "system";
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    setTheme(next);
  }

  if (!mounted) {
    return <div className="size-9 rounded-md p-2" aria-hidden />;
  }

  const current = ORDER.includes(theme as (typeof ORDER)[number])
    ? (theme as (typeof ORDER)[number])
    : "system";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`테마 전환 (현재: ${LABEL[current]})`}
      title={LABEL[current]}
      className="focus-ring rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {current === "dark" ? <Moon className="size-5" /> : <Sun className="size-5" />}
    </button>
  );
}
