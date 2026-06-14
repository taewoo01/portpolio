"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { X, Minus } from "lucide-react";
import { TIMER_CHANNEL_NAME } from "@/lib/timer-channel";
import { useFloatingTimer } from "@/lib/floating-timer-context";
import type { TimerMessage } from "@/lib/timer-channel";

const STORAGE_KEY = "portpolio-timer-pos";
const GIF_SIZE = 80;

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
      initial={{ opacity: 0, scale: 0.8, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 6 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="flex justify-center pb-2"
    >
      <div className="relative rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-lg max-w-[200px] text-center">
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

export function FloatingTimer() {
  const { isOpen, close } = useFloatingTimer();
  const [minimized, setMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [constraints, setConstraints] = useState({ right: 1200, bottom: 800 });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [inputTitle, setInputTitle] = useState("");

  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickRef = useRef<number>(0);
  const prevRunningRef = useRef(false);
  const prevPausedRef = useRef(false);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);

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
    const w = window.innerWidth;
    const h = window.innerHeight;
    setConstraints({ right: w - 280, bottom: h - 60 });
    setIsMobile(w < 640);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const pos = JSON.parse(raw) as { x: number; y: number };
        if (typeof pos.x === "number" && typeof pos.y === "number") {
          motionX.set(Math.min(pos.x, w - 280));
          motionY.set(Math.min(pos.y, h - 60));
          return;
        }
      }
    } catch { /* ignore */ }

    motionX.set(w - 300);
    motionY.set(h - 440);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsMobile(w < 640);
      setConstraints({ right: w - 280, bottom: h - 60 });
      motionX.set(Math.min(motionX.get(), w - 280));
      motionY.set(Math.min(motionY.get(), h - 60));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!gifActive && canvasRef.current && imgRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, GIF_SIZE, GIF_SIZE);
      ctx?.drawImage(imgRef.current, 0, 0, GIF_SIZE, GIF_SIZE);
    }
  }, [gifActive]);

  useEffect(() => {
    if (!isOpen) return;
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
      }
    };
    channel.postMessage({ type: "REQUEST_STATE" });

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  function send(msg: TimerMessage) {
    channelRef.current?.postMessage(msg);
  }

  function savePosition() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: motionX.get(), y: motionY.get() }));
    } catch { /* ignore */ }
  }

  function handleGifClick() {
    const now = Date.now();
    if (now - lastClickRef.current < 2000) return;
    lastClickRef.current = now;

    if (running) showBubble(pick(MESSAGES.clickRunning));
    else if (paused) showBubble(pick(MESSAGES.clickPaused));
    else showBubble(pick(MESSAGES.click));
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="floating-timer"
          drag={!isMobile}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{ left: 0, top: 0, right: constraints.right, bottom: constraints.bottom }}
          onDragEnd={savePosition}
          style={isMobile ? undefined : { x: motionX, y: motionY }}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.88 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={
            isMobile
              ? "fixed bottom-0 left-0 right-0 z-[9999] rounded-t-2xl bg-zinc-900 text-white shadow-2xl"
              : "fixed left-0 top-0 z-[9999] w-[280px] cursor-grab rounded-2xl bg-zinc-900 text-white shadow-2xl active:cursor-grabbing select-none"
          }
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="text-xs font-semibold text-zinc-400 tracking-wide">타이머</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setMinimized((v) => !v)}
                aria-label="최소화"
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <Minus className="size-3.5" />
              </button>
              <button
                onClick={close}
                aria-label="닫기"
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!minimized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col items-center gap-3 px-4 pb-5">
                  {/* 말풍선 */}
                  <AnimatePresence>
                    {bubble && <SpeechBubble key={bubble} message={bubble} />}
                  </AnimatePresence>

                  {/* 도라에몽 GIF */}
                  <div
                    className="relative cursor-pointer"
                    style={{ width: GIF_SIZE, height: GIF_SIZE }}
                    onClick={handleGifClick}
                  >
                    <img
                      ref={imgRef}
                      src="/doraemon.gif"
                      alt="doraemon"
                      width={GIF_SIZE}
                      height={GIF_SIZE}
                      draggable={false}
                      className={`absolute inset-0 rounded-xl object-contain transition-opacity duration-300 ${gifActive ? "opacity-100" : "opacity-0"}`}
                    />
                    <canvas
                      ref={canvasRef}
                      width={GIF_SIZE}
                      height={GIF_SIZE}
                      className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${gifActive ? "opacity-0" : "opacity-40"}`}
                    />
                  </div>

                  {/* 경과 시간 */}
                  <div className="font-mono text-3xl font-bold tabular-nums tracking-tight">
                    {formatDuration(elapsed)}
                  </div>

                  {/* 제목 표시 / 입력 */}
                  {running || paused ? (
                    <p className="max-w-[200px] truncate text-center text-xs text-zinc-400">
                      {title}
                      {paused && <span className="ml-1 text-yellow-400">(일시정지)</span>}
                    </p>
                  ) : (
                    <input
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && inputTitle.trim()) {
                          send({ type: "START", title: inputTitle.trim() });
                        }
                      }}
                      placeholder="공부 내용 입력..."
                      className="w-full max-w-[200px] rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-center text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                    />
                  )}

                  {/* 버튼 */}
                  <div className="flex gap-2">
                    {!running && !paused && (
                      <button
                        onClick={() => inputTitle.trim() && send({ type: "START", title: inputTitle.trim() })}
                        disabled={!inputTitle.trim()}
                        className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        시작
                      </button>
                    )}
                    {running && (
                      <button
                        onClick={() => send({ type: "PAUSE" })}
                        className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-semibold transition-colors hover:bg-zinc-600"
                      >
                        일시정지
                      </button>
                    )}
                    {paused && (
                      <button
                        onClick={() => send({ type: "RESUME" })}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition-colors hover:bg-blue-500"
                      >
                        계속
                      </button>
                    )}
                    {(running || paused) && (
                      <button
                        onClick={() => send({ type: "STOP" })}
                        className="rounded-xl bg-red-600/80 px-4 py-2 text-sm font-semibold transition-colors hover:bg-red-500"
                      >
                        정지
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
