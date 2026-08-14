"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "w-full rounded-xl bg-popover px-4 py-3 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/8",
        "transition-all duration-200 ease-out",
        "data-starting-style:translate-y-2 data-starting-style:opacity-0 data-starting-style:scale-95",
        "data-ending-style:translate-y-1 data-ending-style:opacity-0 data-ending-style:scale-95",
        "data-swipe-direction:transition-none"
      )}
    >
      <div className="flex items-start gap-2.5">
        {toast.type === "error" ? (
          <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
        )}
        <div className="min-w-0 flex-1">
          <ToastPrimitive.Title className="font-medium" />
          {toast.description && (
            <ToastPrimitive.Description className="mt-0.5 text-muted-foreground" />
          )}
        </div>
        <ToastPrimitive.Close
          aria-label="닫기"
          className="focus-ring -m-1 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </ToastPrimitive.Close>
      </div>
    </ToastPrimitive.Root>
  ));
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed bottom-4 left-1/2 z-100 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col-reverse gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}

export function useToast() {
  return ToastPrimitive.useToastManager();
}
