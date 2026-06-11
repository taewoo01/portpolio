"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef, useState, useTransition,
} from "react";
import { startSessionAction, stopSessionAction } from "@/lib/actions/timer";
import { TIMER_CHANNEL_NAME } from "@/lib/timer-channel";
import type { TimerMessage } from "@/lib/timer-channel";

const LS_KEY = "portpolio-timer";

type TimerCtx = {
  sessionId: string | null;
  title: string;
  elapsed: number;
  paused: boolean;
  isPending: boolean;
  start: (title: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  syncFromServer: (active: { id: string; title: string; startAt: Date } | null) => void;
};

const Ctx = createContext<TimerCtx>({
  sessionId: null, title: "", elapsed: 0, paused: false, isPending: false,
  start: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, syncFromServer: () => {},
});

export function useTimer() { return useContext(Ctx); }

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isPending, startTransition] = useTransition();

  const startedAtRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 최신 state를 비동기 콜백에서 stale closure 없이 읽기 위한 ref
  const snapRef = useRef({ sessionId, title, elapsed, paused });
  snapRef.current = { sessionId, title, elapsed, paused };

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify({
      sessionId: snapRef.current.sessionId,
      title: snapRef.current.title,
      paused: snapRef.current.paused,
      startedAt: startedAtRef.current,
      accumulatedMs: accumulatedMsRef.current,
    }));
  }

  function broadcast() {
    const { sessionId: sid, paused: p, title: t } = snapRef.current;
    const e = startedAtRef.current !== null
      ? Math.floor((accumulatedMsRef.current + (Date.now() - startedAtRef.current)) / 1000)
      : Math.floor(accumulatedMsRef.current / 1000);
    channelRef.current?.postMessage({
      type: "STATE", running: Boolean(sid), paused: p, elapsed: e, title: t,
      startedAt: startedAtRef.current, accumulatedMs: accumulatedMsRef.current,
    } satisfies TimerMessage);
  }

  // localStorage에서 복원
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? "null");
      if (!stored) return;
      startedAtRef.current = stored.startedAt ?? null;
      accumulatedMsRef.current = stored.accumulatedMs ?? 0;
      setSessionId(stored.sessionId ?? null);
      setTitle(stored.title ?? "");
      setPaused(stored.paused ?? false);
      const e = stored.startedAt
        ? Math.floor(((stored.accumulatedMs ?? 0) + (Date.now() - stored.startedAt)) / 1000)
        : Math.floor((stored.accumulatedMs ?? 0) / 1000);
      setElapsed(e);
    } catch {}
  }, []);

  // 타이머 인터벌 (sessionId가 있을 때만)
  useEffect(() => {
    if (sessionId) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [sessionId]);

  // 상태 변경 시 float에 브로드캐스트
  useEffect(() => { broadcast(); }, [sessionId, paused, elapsed, title]);

  // BroadcastChannel — 항상 마운트되어 있어서 어느 페이지에서든 커맨드 수신
  useEffect(() => {
    const ch = new BroadcastChannel(TIMER_CHANNEL_NAME);
    channelRef.current = ch;
    ch.onmessage = (e: MessageEvent<TimerMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case "REQUEST_STATE": broadcast(); break;
        case "START":         actionsRef.current.start(msg.title); break;
        case "PAUSE":         actionsRef.current.pause(); break;
        case "RESUME":        actionsRef.current.resume(); break;
        case "STOP":          actionsRef.current.stop(); break;
      }
    };
    return () => ch.close();
  }, []);

  // actionsRef: BroadcastChannel 핸들러에서 stale closure 없이 최신 로직 호출
  const actionsRef = useRef({ start: (_t: string) => {}, pause: () => {}, resume: () => {}, stop: () => {} });

  actionsRef.current.start = (t: string) => {
    const { sessionId: sid, paused: p } = snapRef.current;
    if (sid || p) return;
    startTransition(async () => {
      const id = await startSessionAction(t);
      startedAtRef.current = Date.now();
      accumulatedMsRef.current = 0;
      setSessionId(id); setTitle(t); setElapsed(0); setPaused(false);
      snapRef.current = { sessionId: id, title: t, elapsed: 0, paused: false };
      save();
    });
  };

  actionsRef.current.pause = () => {
    const { sessionId: sid } = snapRef.current;
    if (!sid) return;
    const currentElapsed = startedAtRef.current !== null
      ? Math.floor((accumulatedMsRef.current + (Date.now() - startedAtRef.current)) / 1000)
      : snapRef.current.elapsed;
    startTransition(async () => {
      await stopSessionAction(sid);
      accumulatedMsRef.current = currentElapsed * 1000;
      startedAtRef.current = null;
      setSessionId(null); setPaused(true);
      snapRef.current = { ...snapRef.current, sessionId: null, paused: true };
      save();
    });
  };

  actionsRef.current.resume = () => {
    const { paused: p, title: t } = snapRef.current;
    if (!p) return;
    startTransition(async () => {
      const id = await startSessionAction(t);
      startedAtRef.current = Date.now();
      setSessionId(id); setPaused(false);
      snapRef.current = { ...snapRef.current, sessionId: id, paused: false };
      save();
    });
  };

  actionsRef.current.stop = () => {
    const { sessionId: sid } = snapRef.current;
    const reset = () => {
      startedAtRef.current = null;
      accumulatedMsRef.current = 0;
      setSessionId(null); setTitle(""); setElapsed(0); setPaused(false);
      snapRef.current = { sessionId: null, title: "", elapsed: 0, paused: false };
      localStorage.removeItem(LS_KEY);
    };
    if (sid) {
      startTransition(async () => { await stopSessionAction(sid); reset(); });
    } else {
      reset();
    }
  };

  // timer-widget이 서버에서 받은 active session을 context에 동기화
  const syncFromServer = useCallback((active: { id: string; title: string; startAt: Date } | null) => {
    if (!active) return;
    if (snapRef.current.sessionId === active.id) return; // 이미 동기화됨
    const startedAt = new Date(active.startAt).getTime();
    const e = Math.floor((Date.now() - startedAt) / 1000);
    startedAtRef.current = startedAt;
    accumulatedMsRef.current = 0;
    setSessionId(active.id); setTitle(active.title); setElapsed(e); setPaused(false);
    snapRef.current = { sessionId: active.id, title: active.title, elapsed: e, paused: false };
    localStorage.setItem(LS_KEY, JSON.stringify({
      sessionId: active.id, title: active.title, paused: false, startedAt, accumulatedMs: 0,
    }));
  }, []);

  const start   = useCallback((t: string) => actionsRef.current.start(t), []);
  const pause   = useCallback(() => actionsRef.current.pause(), []);
  const resume  = useCallback(() => actionsRef.current.resume(), []);
  const stop    = useCallback(() => actionsRef.current.stop(), []);

  return (
    <Ctx.Provider value={{ sessionId, title, elapsed, paused, isPending, start, pause, resume, stop, syncFromServer }}>
      {children}
    </Ctx.Provider>
  );
}
