"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTimer } from "@/lib/timer-store";
import type { StudySessionModel } from "@/generated/prisma/models";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function TimerWidget({ active }: { active: StudySessionModel | null }) {
  const { sessionId, title, elapsed, paused, isPending, start, pause, resume, stop, syncFromServer } = useTimer();
  const [inputTitle, setInputTitle] = useState("");
  const isRunning = Boolean(sessionId);

  // 서버에서 받은 active session을 context에 동기화
  useEffect(() => {
    if (active) syncFromServer(active);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-6 text-center">
        <div className="font-mono text-6xl font-bold tabular-nums tracking-tight">
          {formatDuration(elapsed)}
        </div>
        {(isRunning || paused) && (
          <p className="mt-2 text-sm text-muted-foreground">
            {title}
            {paused && <span className="ml-2 text-yellow-500 text-xs">(일시정지)</span>}
          </p>
        )}
      </div>

      {isRunning && (
        <div className="flex justify-center gap-2">
          <Button size="lg" variant="outline" onClick={pause} disabled={isPending} className="w-32">
            일시정지
          </Button>
          <Button size="lg" variant="destructive" onClick={stop} disabled={isPending} className="w-32">
            정지
          </Button>
        </div>
      )}

      {paused && (
        <div className="flex justify-center gap-2">
          <Button size="lg" onClick={resume} disabled={isPending} className="w-32">
            계속
          </Button>
          <Button size="lg" variant="destructive" onClick={stop} disabled={isPending} className="w-32">
            정지
          </Button>
        </div>
      )}

      {!isRunning && !paused && (
        <div className="flex gap-2">
          <Input
            placeholder="공부 내용을 입력하세요"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start(inputTitle.trim())}
            disabled={isPending}
          />
          <Button onClick={() => start(inputTitle.trim())} disabled={isPending || !inputTitle.trim()} className="shrink-0">
            시작
          </Button>
        </div>
      )}
    </div>
  );
}
