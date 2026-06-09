"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startSessionAction, stopSessionAction } from "@/lib/actions/timer";
import type { StudySessionModel } from "@/generated/prisma/models";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function TimerWidget({ active }: { active: StudySessionModel | null }) {
  const [sessionId, setSessionId] = useState<string | null>(active?.id ?? null);
  const [title, setTitle] = useState(active?.title ?? "");
  const [elapsed, setElapsed] = useState(() =>
    active ? Math.floor((Date.now() - new Date(active.startAt).getTime()) / 1000) : 0
  );
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = Boolean(sessionId);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  function handleStart() {
    if (!title.trim()) return;
    startTransition(async () => {
      const id = await startSessionAction(title.trim());
      setSessionId(id);
      setElapsed(0);
    });
  }

  function handleStop() {
    if (!sessionId) return;
    startTransition(async () => {
      await stopSessionAction(sessionId);
      setSessionId(null);
      setTitle("");
      setElapsed(0);
    });
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-6 text-center">
        <div className="font-mono text-6xl font-bold tabular-nums tracking-tight">
          {formatDuration(elapsed)}
        </div>
        {isRunning && (
          <p className="mt-2 text-sm text-muted-foreground">{title}</p>
        )}
      </div>

      {isRunning ? (
        <div className="flex justify-center">
          <Button
            size="lg"
            variant="destructive"
            onClick={handleStop}
            disabled={isPending}
            className="w-32"
          >
            정지
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="공부 내용을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            disabled={isPending}
          />
          <Button onClick={handleStart} disabled={isPending || !title.trim()} className="shrink-0">
            시작
          </Button>
        </div>
      )}
    </div>
  );
}
