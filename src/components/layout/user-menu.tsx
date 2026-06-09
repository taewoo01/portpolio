"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { USER_LABEL, type User } from "@/lib/auth";

export function UserMenu({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground">{USER_LABEL[user]}</span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        aria-label="로그아웃"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
