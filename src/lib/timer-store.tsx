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
  subjectId: string | null;
  elapsed: number;
  paused: boolean;
  isPending: boolean;
  start: (title: string, subjectId?: string | null) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  syncFromServer: (active: { id: string; title: string; startAt: Date; subjectId: string | null } | null) => void;
};

const Ctx = createContext<TimerCtx>({
  sessionId: null, title: "", subjectId: null, elapsed: 0, paused: false, isPending: false,
  start: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, syncFromServer: () => {},
});

export function useTimer() { return useContext(Ctx); }

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isPending, startTransition] = useTransition();

  const startedAtRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 최신 state를 비동기 콜백에서 stale closure 없이 읽기 위한 ref
  const snapRef = useRef({ sessionId, title, subjectId, elapsed, paused });
  snapRef.current = { sessionId, title, subjectId, elapsed, paused };

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify({
      sessionId: snapRef.current.sessionId,
      title: snapRef.current.title,
      subjectId: snapRef.current.subjectId,
      paused: snapRef.current.paused,
      startedAt: startedAtRef.current,
      accumulatedMs: accumulatedMsRef.current,
    }));
  }

  function broadcast() {
    const { sessionId: sid, paused: p, title: t, subjectId: subId } = snapRef.current;
    const e = startedAtRef.current !== null
      ? Math.floor((accumulatedMsRef.current + (Date.now() - startedAtRef.current)) / 1000)
      : Math.floor(accumulatedMsRef.current / 1000);
    channelRef.current?.postMessage({
      type: "STATE", sessionId: sid, running: Boolean(sid), paused: p, elapsed: e, title: t, subjectId: subId,
      startedAt: startedAtRef.current, accumulatedMs: accumulatedMsRef.current,
    } satisfies TimerMessage);
  }

  // 다중 탭 단일 작성자(리더) 선출 — 리더 탭만 서버 액션 실행 + STATE 방송.
  // 리더 탭이 닫히면 락이 해제되어 대기 중인 다음 탭이 자동 승격된다.
  const isLeaderRef = useRef(false);
  useEffect(() => {
    if (!("locks" in navigator)) {
      isLeaderRef.current = true; // Web Locks 미지원 → 기존(단일 탭) 동작
      return;
    }
    let release: (() => void) | null = null;
    let unmounted = false;
    navigator.locks.request("timer-owner", () => {
      if (unmounted) return; // 락 획득 전에 언마운트됨 → 즉시 다음 탭에 양보
      isLeaderRef.current = true;
      broadcast(); // 승격 시 현재 상태 공지
      return new Promise<void>((resolve) => { release = resolve; });
    });
    return () => {
      unmounted = true;
      isLeaderRef.current = false;
      release?.();
    };
  }, []);

  // localStorage에서 복원
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? "null");
      if (!stored) return;
      startedAtRef.current = stored.startedAt ?? null;
      accumulatedMsRef.current = stored.accumulatedMs ?? 0;
      setSessionId(stored.sessionId ?? null);
      setTitle(stored.title ?? "");
      setSubjectId(stored.subjectId ?? null);
      setPaused(stored.paused ?? false);
      const e = stored.startedAt
        ? Math.floor(((stored.accumulatedMs ?? 0) + (Date.now() - stored.startedAt)) / 1000)
        : Math.floor((stored.accumulatedMs ?? 0) / 1000);
      setElapsed(e);
    } catch {}
  }, []);

  // 타이머 인터벌 (sessionId가 있을 때만)
  const AUTO_STOP_SECONDS = 43200; // 12시간

  useEffect(() => {
    if (sessionId) {
      intervalRef.current = setInterval(() => {
        const currentElapsed = startedAtRef.current !== null
          ? Math.floor((accumulatedMsRef.current + (Date.now() - startedAtRef.current)) / 1000)
          : Math.floor(accumulatedMsRef.current / 1000);

        if (currentElapsed >= AUTO_STOP_SECONDS) {
          if (isLeaderRef.current) {
            channelRef.current?.postMessage({
              type: "STATE",
              sessionId: null,
              running: false,
              paused: false,
              elapsed: currentElapsed,
              title: snapRef.current.title,
              subjectId: snapRef.current.subjectId,
              startedAt: null,
              accumulatedMs: accumulatedMsRef.current,
              autoStop: true,
            });
            actionsRef.current.stop();
          }
          return;
        }

        setElapsed(currentElapsed);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [sessionId]);

  // 상태 변경 시 float에 브로드캐스트 (리더만 — 비리더의 재방송 루프 방지)
  useEffect(() => { if (isLeaderRef.current) broadcast(); }, [sessionId, paused, elapsed, title, subjectId]);

  // BroadcastChannel — 항상 마운트되어 있어서 어느 페이지에서든 커맨드 수신
  useEffect(() => {
    const ch = new BroadcastChannel(TIMER_CHANNEL_NAME);
    channelRef.current = ch;
    ch.onmessage = (e: MessageEvent<TimerMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case "STATE":
          // 비리더 탭은 리더의 상태를 그대로 채택 (자체 서버 액션 실행 금지)
          if (!isLeaderRef.current) {
            startedAtRef.current = msg.startedAt;
            accumulatedMsRef.current = msg.accumulatedMs;
            setSessionId(msg.sessionId); setTitle(msg.title); setSubjectId(msg.subjectId);
            setPaused(msg.paused); setElapsed(msg.elapsed);
            snapRef.current = { sessionId: msg.sessionId, title: msg.title, subjectId: msg.subjectId, elapsed: msg.elapsed, paused: msg.paused };
          }
          break;
        case "REQUEST_STATE": if (isLeaderRef.current) broadcast(); break;
        case "START":         if (isLeaderRef.current) actionsRef.current.start(msg.title, msg.subjectId); break;
        case "PAUSE":         if (isLeaderRef.current) actionsRef.current.pause(); break;
        case "RESUME":        if (isLeaderRef.current) actionsRef.current.resume(); break;
        case "STOP":          if (isLeaderRef.current) actionsRef.current.stop(); break;
      }
    };
    return () => ch.close();
  }, []);

  // actionsRef: BroadcastChannel 핸들러에서 stale closure 없이 최신 로직 호출
  const actionsRef = useRef<{
    start: (t: string, subjectId: string | null) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
  }>({ start: () => {}, pause: () => {}, resume: () => {}, stop: () => {} });
  // await 이전에 동기적으로 세팅되는 중복 실행 가드 (더블 스타트 레이스 차단)
  const inFlightRef = useRef(false);

  actionsRef.current.start = (t: string, subId: string | null) => {
    if (!isLeaderRef.current) {
      channelRef.current?.postMessage({ type: "START", title: t, subjectId: subId } satisfies TimerMessage);
      return;
    }
    const { sessionId: sid, paused: p } = snapRef.current;
    if (sid || p || inFlightRef.current) return;
    inFlightRef.current = true;
    startTransition(async () => {
      try {
        const id = await startSessionAction(t, subId);
        startedAtRef.current = Date.now();
        accumulatedMsRef.current = 0;
        setSessionId(id); setTitle(t); setSubjectId(subId); setElapsed(0); setPaused(false);
        snapRef.current = { sessionId: id, title: t, subjectId: subId, elapsed: 0, paused: false };
        save();
      } finally {
        inFlightRef.current = false;
      }
    });
  };

  actionsRef.current.pause = () => {
    if (!isLeaderRef.current) {
      channelRef.current?.postMessage({ type: "PAUSE" } satisfies TimerMessage);
      return;
    }
    const { sessionId: sid } = snapRef.current;
    if (!sid || inFlightRef.current) return;
    const currentElapsed = startedAtRef.current !== null
      ? Math.floor((accumulatedMsRef.current + (Date.now() - startedAtRef.current)) / 1000)
      : snapRef.current.elapsed;
    inFlightRef.current = true;
    startTransition(async () => {
      try {
        await stopSessionAction(sid);
        accumulatedMsRef.current = currentElapsed * 1000;
        startedAtRef.current = null;
        setSessionId(null); setPaused(true);
        snapRef.current = { ...snapRef.current, sessionId: null, paused: true };
        save();
      } finally {
        inFlightRef.current = false;
      }
    });
  };

  actionsRef.current.resume = () => {
    if (!isLeaderRef.current) {
      channelRef.current?.postMessage({ type: "RESUME" } satisfies TimerMessage);
      return;
    }
    const { paused: p, title: t, subjectId: subId } = snapRef.current;
    if (!p || inFlightRef.current) return;
    inFlightRef.current = true;
    startTransition(async () => {
      try {
        const id = await startSessionAction(t, subId);
        startedAtRef.current = Date.now();
        setSessionId(id); setPaused(false);
        snapRef.current = { ...snapRef.current, sessionId: id, paused: false };
        save();
      } finally {
        inFlightRef.current = false;
      }
    });
  };

  actionsRef.current.stop = () => {
    if (!isLeaderRef.current) {
      channelRef.current?.postMessage({ type: "STOP" } satisfies TimerMessage);
      return;
    }
    const { sessionId: sid } = snapRef.current;
    const reset = () => {
      startedAtRef.current = null;
      accumulatedMsRef.current = 0;
      setSessionId(null); setTitle(""); setSubjectId(null); setElapsed(0); setPaused(false);
      snapRef.current = { sessionId: null, title: "", subjectId: null, elapsed: 0, paused: false };
      localStorage.removeItem(LS_KEY);
    };
    if (sid) {
      startTransition(async () => { await stopSessionAction(sid); reset(); });
    } else {
      reset();
    }
  };

  // timer-widget이 서버에서 받은 active session을 context에 동기화
  const syncFromServer = useCallback((active: { id: string; title: string; startAt: Date; subjectId: string | null } | null) => {
    if (!active) return;
    if (snapRef.current.sessionId === active.id) return; // 이미 동기화됨
    const startedAt = new Date(active.startAt).getTime();
    const e = Math.floor((Date.now() - startedAt) / 1000);
    startedAtRef.current = startedAt;
    accumulatedMsRef.current = 0;
    setSessionId(active.id); setTitle(active.title); setSubjectId(active.subjectId); setElapsed(e); setPaused(false);
    snapRef.current = { sessionId: active.id, title: active.title, subjectId: active.subjectId, elapsed: e, paused: false };
    localStorage.setItem(LS_KEY, JSON.stringify({
      sessionId: active.id, title: active.title, subjectId: active.subjectId, paused: false, startedAt, accumulatedMs: 0,
    }));
  }, []);

  const start   = useCallback((t: string, subId: string | null = null) => actionsRef.current.start(t, subId), []);
  const pause   = useCallback(() => actionsRef.current.pause(), []);
  const resume  = useCallback(() => actionsRef.current.resume(), []);
  const stop    = useCallback(() => actionsRef.current.stop(), []);

  return (
    <Ctx.Provider value={{ sessionId, title, subjectId, elapsed, paused, isPending, start, pause, resume, stop, syncFromServer }}>
      {children}
    </Ctx.Provider>
  );
}
