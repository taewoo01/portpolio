"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { TIMER_CHANNEL_NAME } from "@/lib/timer-channel";
import type { TimerMessage } from "@/lib/timer-channel";

const GIF_SIZE = 112;

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function FloatContent({ onClose }: { onClose: () => void }) {
  const [isElectron, setIsElectron] = useState(false);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const channelRef = useRef<BroadcastChannel | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gifActive = running && !paused;

  // Electron 환경 감지 + 투명 배경 적용
  useEffect(() => {
    const electron = !!window.electronAPI?.isElectron;
    setIsElectron(electron);
    if (electron) {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
    }
  }, []);

  // GIF 비활성 시 캔버스에 현재 프레임 캡처 (일시정지/정지 시 동결 효과)
  useEffect(() => {
    if (!gifActive && canvasRef.current && imgRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, GIF_SIZE, GIF_SIZE);
        ctx.drawImage(imgRef.current, 0, 0, GIF_SIZE, GIF_SIZE);
      }
    }
  }, [gifActive]);

  // BroadcastChannel 연결
  useEffect(() => {
    const channel = new BroadcastChannel(TIMER_CHANNEL_NAME);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<TimerMessage>) => {
      const msg = event.data;
      if (msg.type === "STATE") {
        setRunning(msg.running);
        setPaused(msg.paused);
        setElapsed(msg.elapsed);
        if (msg.title) setTitle(msg.title);
      }
    };
    channel.postMessage({ type: "REQUEST_STATE" });
    return () => channel.close();
  }, []);

  function send(msg: TimerMessage) {
    channelRef.current?.postMessage(msg);
  }

  // ─── 공통 버튼 ────────────────────────────────────────────────────────────
  const buttons = (
    <div className="flex gap-2" style={{ WebkitAppRegion: "no-drag" }}>
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
  );

  // ─── GIF / 캔버스 ─────────────────────────────────────────────────────────
  const gifArea = (
    <div className="relative size-28">
      {/* 실행 중: 정상 GIF 재생 */}
      <img
        ref={imgRef}
        src="/doraemon.gif"
        alt="doraemon"
        width={GIF_SIZE}
        height={GIF_SIZE}
        draggable={false}
        className={`absolute inset-0 size-28 rounded-xl object-contain transition-opacity duration-300 ${gifActive ? "opacity-100" : "opacity-0"}`}
      />
      {/* 일시정지: 동결 프레임 + grayscale / 정지: 동결 프레임 + 어둡게 */}
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
  );

  // ─── Electron: 투명 배경 + 드래그 가능한 둥근 카드 ────────────────────────
  if (isElectron) {
    return (
      <div className="h-screen w-screen p-1.5 flex flex-col">
        <div
          className="flex-1 bg-zinc-900/95 rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white select-none"
          style={{ WebkitAppRegion: "drag" }}
        >
          {/* 상단: 닫기 버튼 */}
          <div className="flex justify-end px-3 pt-3" style={{ WebkitAppRegion: "no-drag" }}>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* 중앙 콘텐츠 */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-6">
            {gifArea}

            {/* 경과 시간 */}
            <div
              className="font-mono text-4xl font-bold tabular-nums tracking-tight"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
            >
              {formatDuration(elapsed)}
            </div>

            {/* 제목 / 입력 */}
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
                  e.key === "Enter" && inputTitle.trim() && send({ type: "START", title: inputTitle.trim() })
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

  // ─── 웹 (Document PiP / 인페이지): 기존 전체 채우기 레이아웃 ───────────────
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
