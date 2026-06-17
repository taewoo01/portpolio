"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { TIMER_CHANNEL_NAME } from "@/lib/timer-channel";
import type { TimerMessage } from "@/lib/timer-channel";

const GIF_SIZE = 112;

const MESSAGES = {
  start:        ["같이 열심히 해보자! 💪", "집중 모드 ON! 🔥", "화이팅! ✨", "오늘도 파이팅! 🎉"],
  pause:        ["잠깐 쉬어가~ 😊", "금방 돌아와!", "숨 좀 고르자!", "짧게 쉬고 다시!"],
  resume:       ["다시 달려보자! 🚀", "잘 쉬었어? 파이팅!", "집중 또 집중! 🎯", "이번엔 더 잘할 수 있어!"],
  stop:         ["수고했어! 🥰", "오늘도 고생했어~", "훌륭해! 내일도 화이팅!", "잘했어! 😄"],
  click:        ["뭐 공부할 거야?", "나 여기 있어! 😄", "언제 시작해?", "같이 하자~"],
  clickRunning: ["잘 하고 있어! 👍", "집중 또 집중! 🔥", "조금만 더!", "멈추지 마! 💪"],
  clickPaused:  ["빨리 다시 시작해!", "쉬는 시간 끝~?", "조금만 더 힘내!", "거의 다 왔어!"],
};

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function SpeechBubble({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="flex justify-center pb-2"
    >
      <div className="relative rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-lg">
        {message}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 rotate-45 bg-white" />
      </div>
    </motion.div>
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

interface FloatContentProps {
  onClose: () => void;
  onStart?: (title: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

export function FloatContent({ onClose, onStart, onPause, onResume, onStop }: FloatContentProps) {
  const [isElectron, setIsElectron] = useState(false);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [bubble, setBubble] = useState<string | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const runningRef = useRef(false);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickRef = useRef<number>(0);
  const prevRunningRef = useRef(false);
  const prevPausedRef = useRef(false);

  const gifActive = running && !paused;

  function showBubble(msg: string, duration = 3000) {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    setBubble(msg);
    bubbleTimerRef.current = setTimeout(() => setBubble(null), duration);
  }

  useEffect(() => () => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
  }, []);

  useEffect(() => {
    const electron = !!window.electronAPI?.isElectron;
    setIsElectron(electron);
    if (electron) {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
    }
  }, []);

  useEffect(() => {
    if (!gifActive && canvasRef.current && imgRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, GIF_SIZE, GIF_SIZE);
        ctx.drawImage(imgRef.current, 0, 0, GIF_SIZE, GIF_SIZE);
      }
    }
  }, [gifActive]);

  useEffect(() => {
    const channel = new BroadcastChannel(TIMER_CHANNEL_NAME);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<TimerMessage>) => {
      const msg = event.data;
      if (msg.type === "STATE") {
        const wasRunning = prevRunningRef.current;
        const wasPaused = prevPausedRef.current;

        if (!wasRunning && !wasPaused && msg.running && !msg.paused) {
          showBubble(pick(MESSAGES.start));
        } else if (wasRunning && !wasPaused && msg.paused) {
          showBubble(pick(MESSAGES.pause));
        } else if (wasPaused && msg.running && !msg.paused) {
          showBubble(pick(MESSAGES.resume));
        } else if ((wasRunning || wasPaused) && !msg.running && !msg.paused) {
          showBubble(pick(MESSAGES.stop), 4000);
        }

        prevRunningRef.current = msg.running;
        prevPausedRef.current = msg.paused;

        setRunning(msg.running);
        setPaused(msg.paused);
        setElapsed(msg.elapsed);
        if (msg.title) setTitle(msg.title);
        startedAtRef.current = msg.startedAt ?? null;
        accumulatedMsRef.current = msg.accumulatedMs ?? msg.elapsed * 1000;
        runningRef.current = msg.running;
      }
    };
    channel.postMessage({ type: "REQUEST_STATE" });
    return () => channel.close();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (runningRef.current && startedAtRef.current !== null) {
        const computed = Math.floor(
          (accumulatedMsRef.current + (Date.now() - startedAtRef.current)) / 1000
        );
        setElapsed(computed);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function send(msg: TimerMessage) {
    channelRef.current?.postMessage(msg);
  }

  function handleGifClick() {
    const now = Date.now();
    if (now - lastClickRef.current < 2000) return;
    lastClickRef.current = now;
    if (running) showBubble(pick(MESSAGES.clickRunning));
    else if (paused) showBubble(pick(MESSAGES.clickPaused));
    else showBubble(pick(MESSAGES.click));
  }

  const buttons = (
    <div className="flex gap-2" style={{ WebkitAppRegion: "no-drag" }}>
      {!running && !paused && (
        <button
          onClick={() => inputTitle.trim() && (onStart ? onStart(inputTitle.trim()) : send({ type: "START", title: inputTitle.trim() }))}
          disabled={!inputTitle.trim()}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          시작
        </button>
      )}
      {running && (
        <button
          onClick={() => onPause ? onPause() : send({ type: "PAUSE" })}
          className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-semibold transition-colors hover:bg-zinc-600"
        >
          일시정지
        </button>
      )}
      {paused && (
        <button
          onClick={() => onResume ? onResume() : send({ type: "RESUME" })}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition-colors hover:bg-blue-500"
        >
          계속
        </button>
      )}
      {(running || paused) && (
        <button
          onClick={() => onStop ? onStop() : send({ type: "STOP" })}
          className="rounded-xl bg-red-600/80 px-4 py-2 text-sm font-semibold transition-colors hover:bg-red-500"
        >
          정지
        </button>
      )}
    </div>
  );

  const gifArea = (
    <div className="flex flex-col items-center" style={{ WebkitAppRegion: "no-drag" }}>
      <AnimatePresence>
        {bubble && <SpeechBubble key={bubble} message={bubble} />}
      </AnimatePresence>
      <div
        className="relative size-28 cursor-pointer"
        onClick={handleGifClick}
      >
      <img
        ref={imgRef}
        src="/doraemon.gif"
        alt="doraemon"
        width={GIF_SIZE}
        height={GIF_SIZE}
        draggable={false}
        className={`absolute inset-0 size-28 rounded-xl object-contain transition-opacity duration-300 ${gifActive ? "opacity-100" : "opacity-0"}`}
      />
      <canvas
        ref={canvasRef}
        width={GIF_SIZE}
        height={GIF_SIZE}
        className={[
          "absolute inset-0 size-28 rounded-xl transition-all duration-300",
          gifActive ? "opacity-0" : paused ? "grayscale opacity-60" : "opacity-40",
        ].join(" ")}
      />
      </div>
    </div>
  );

  if (isElectron) {
    return (
      <div className="h-screen w-screen p-1.5 flex flex-col">
        <div
          className="flex-1 bg-zinc-900/95 rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white select-none"
          style={{ WebkitAppRegion: "drag" }}
        >
          <div className="flex justify-end px-3 pt-3" style={{ WebkitAppRegion: "no-drag" }}>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-6">
            {gifArea}

            <div
              className="font-mono text-4xl font-bold tabular-nums tracking-tight"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
            >
              {formatDuration(elapsed)}
            </div>

            {running || paused ? (
              <p className="max-w-[200px] truncate text-center text-xs text-zinc-400">
                {title}
                {paused && <span className="ml-1 text-yellow-400">(일시정지)</span>}
              </p>
            ) : (
              <input
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && inputTitle.trim() && (onStart ? onStart(inputTitle.trim()) : send({ type: "START", title: inputTitle.trim() }))
                }
                placeholder="공부 내용 입력..."
                style={{ WebkitAppRegion: "no-drag" }}
                className="w-full max-w-[200px] rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-center text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
              />
            )}

            {buttons}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-900 text-white select-none">
      <div className="flex justify-end px-3 pt-3">
        <button
          onClick={onClose}
          aria-label="닫기"
          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-6">
        {gifArea}

        <div className="font-mono text-4xl font-bold tabular-nums tracking-tight">
          {formatDuration(elapsed)}
        </div>

        {running || paused ? (
          <p className="max-w-[200px] truncate text-center text-xs text-zinc-400">
            {title}
            {paused && <span className="ml-2 text-yellow-400 text-xs">(일시정지)</span>}
          </p>
        ) : (
          <input
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && inputTitle.trim() && send({ type: "START", title: inputTitle.trim() })
            }
            placeholder="공부 내용 입력..."
            className="w-full max-w-[200px] rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-center text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />
        )}

        {buttons}
      </div>
    </div>
  );
}
