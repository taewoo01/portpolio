"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Home, Code2, BookOpen, CalendarDays, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOpenSearchPalette } from "@/components/search/search-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { User } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/dev", label: "개발" },
  { href: "/study", label: "공부" },
  { href: "/calendar", label: "일정" },
  { href: "/blog", label: "블로그" },
  { href: "/timer", label: "타이머" },
  { href: "/about", label: "About" },
];

const BOTTOM_NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/dev", label: "개발", icon: Code2 },
  { href: "/study", label: "공부", icon: BookOpen },
  { href: "/calendar", label: "일정", icon: CalendarDays },
  { href: "/timer", label: "타이머", icon: Timer },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const openSearchPalette = useOpenSearchPalette();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-bold tracking-tight text-foreground">
              portpolio
            </Link>
            <ul className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className="relative">
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg bg-accent"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <Link
                      href={item.href}
                      className={cn(
                        "relative z-10 block rounded-lg px-3 py-1.5 text-sm transition-colors duration-150",
                        active
                          ? "font-semibold text-foreground"
                          : "font-medium text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={openSearchPalette}
              aria-label="검색 (Ctrl+K)"
              className="rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
            >
              <Search className="size-4" />
            </button>
            <ThemeToggle />
            {user && <UserMenu user={user} />}
          </div>
        </nav>
      </header>

      {/* 모바일 하단 탭 바 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-16 items-center justify-around px-1">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              >
                {active && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 size-5 transition-colors duration-150",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-medium transition-colors duration-150",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
