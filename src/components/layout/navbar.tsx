"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
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

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const openSearchPalette = useOpenSearchPalette();

  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            portpolio
          </Link>
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive(pathname, item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openSearchPalette}
            aria-label="검색 (Ctrl+K)"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Search className="size-5" />
          </button>
          <ThemeToggle />
          {user && <UserMenu user={user} />}
        </div>
      </nav>
    </header>
  );
}
