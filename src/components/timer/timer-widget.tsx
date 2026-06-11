"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startSessionAction, stopSessionAction } from "@/lib/actions/timer";
import { TIMER_CHANNEL_NAME } from "@/lib/timer-channel";
import type { StudySessionModel } from "@/generated/prisma/models";
import type { TimerMessage } from "@/lib/timer-channel";

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
  // paused: DB 세션은 종료된 상태, UI만 일시정지 표시
  const [paused, setPaused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const isRunning = Boolean(sessionId);

  // float 창이 독립적으로 시간 계산할 수 있도록 타임스탬프 추적
  const startedAtRef = useRef<number | null>(
    active ? new Date(active.startAt).getTime() : null
  );
  const accumulatedMsRef = useRef<number>(0);

  const actionsRef = useRef({
    start: (_t: string) => {},
    pause: () => {},
    resume: () => {},
    stop: () => {},
    getState: (): TimerMessage => ({
      type: "STATE", running: false, paused: false, elapsed: 0, title: "",
      startedAt: null, accumulatedMs: 0,
    }),
  });

  actionsRef.current = {
    start: (t: string) => {
      if (sessionId || paused) return;
      startTransition(async () => {
        const id = await startSessionAction(t);
        startedAtRef.current = Date.now();
        accumulatedMsRef.current = 0;
        setSessionId(id);
        setTitle(t);
        setElapsed(0);
        setPaused(false);
      });
    },
    // 일시정지: DB 세션 종료 + elapsed 유지
    pause: () => {
      if (!sessionId) return;
      const id = sessionId;
      startTransition(async () => {
        await stopSessionAction(id);
        accumulatedMsRef.current = elapsed * 1000;
        startedAtRef.current = null;
        setSessionId(null);
        setPaused(true);
      });
    },
    // 재개: 새 DB 세션 시작 + elapsed 이어서
    resume: () => {
      if (!paused) return;
      const t = title;
      startTransition(async () => {
        const id = await startSessionAction(t);
        startedAtRef.current = Date.now();
        setSessionId(id);
        setPaused(false);
      });
    },
    // 정지: 실행 중이면 DB 종료, 일시정지 중이면 이미 종료 완료 → 그냥 리셋
    stop: () => {
      if (sessionId) {
        const id = sessionId;
        startTransition(async () => {
          await stopSessionAction(id);
          startedAtRef.current = null;
          accumulatedMsRef.current = 0;
          setSessionId(null);
          setTitle("");
          setElapsed(0);
          setPaused(false);
        });
      } else {
        startedAtRef.current = null;
        accumulatedMsRef.current = 0;
        setTitle("");
        setElapsed(0);
        setPaused(false);
      }
    },
    getState: () => ({
      type: "STATE",
      running: Boolean(sessionId),
      paused,
      elapsed,
      title,
      startedAt: startedAtRef.current,
      accumulatedMs: accumulatedMsRef.current,
    }),
  };

  // 인터벌: sessionId가 있을 때만 (paused면 sessionId=null이라 자동 중지)
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  // BroadcastChannel 초기화
  useEffect(() => {
    const channel = new BroadcastChannel(TIMER_CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<TimerMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case "REQUEST_STATE": channel.postMessage(actionsRef.current.getState()); break;
        case "START": actionsRef.current.start(msg.title); break;
        case "PAUSE": actionsRef.current.pause(); break;
        case "RESUME": actionsRef.current.resume(); break;
        case "STOP": actionsRef.current.stop(); break;
      }
    };

    return () => channel.close();
  }, []);

  // 상태 변경 시 플로팅 창에 브로드캐스트 (startedAt/accumulatedMs 포함)
  useEffect(() => {
    channelRef.current?.postMessage({
      type: "STATE",
      running: Boolean(sessionId),
      paused,
      elapsed,
      title,
      startedAt: startedAtRef.current,
      accumulatedMs: accumulatedMsRef.current,
    } satisfies TimerMessage);
  }, [sessionId, paused, elapsed, title]);

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
          <Button size="lg" variant="outline" onClick={() => actionsRef.current.pause()} disabled={isPending} className="w-32">
            일시정지
          </Button>
          <Button size="lg" variant="destructive" onClick={() => actionsRef.current.stop()} disabled={isPending} className="w-32">
            정지
          </Button>
        </div>
      )}

      {paused && (
        <div className="flex justify-center gap-2">
          <Button size="lg" onClick={() => actionsRef.current.resume()} disabled={isPending} className="w-32">
            계속
          </Button>
          <Button size="lg" variant="destructive" onClick={() => actionsRef.current.stop()} disabled={isPending} className="w-32">
            정지
          </Button>
        </div>
      )}

      {!isRunning && !paused && (
        <div className="flex gap-2">
          <Input
            placeholder="공부 내용을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && actionsRef.current.start(title.trim())}
            disabled={isPending}
          />
          <Button onClick={() => actionsRef.current.start(title.trim())} disabled={isPending || !title.trim()} className="shrink-0">
            시작
          </Button>
        </div>
      )}
    </div>
  );
}
