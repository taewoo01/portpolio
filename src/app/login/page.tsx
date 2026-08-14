"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { loginAction } from "@/lib/actions/auth";

const TerrainCanvas = dynamic(
  () => import("@/components/login/terrain-canvas"),
  { ssr: false }
);

export default function LoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    if (digit && index < 3) {
      refs[index + 1].current?.focus();
    }

    if (digit && index === 3) {
      const pin = [...next.slice(0, 3), digit].join("");
      if (pin.length === 4) submit(pin);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  }

  function submit(pin: string) {
    startTransition(async () => {
      const err = await loginAction(pin);
      if (err) {
        setError(err);
        setDigits(["", "", "", ""]);
        refs[0].current?.focus();
      } else {
        router.replace("/");
      }
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <TerrainCanvas />

      {/* Glassmorphism 카드 */}
      <div className="flex flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/5 px-10 py-12 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">portpolio</h1>
          <p className="mt-1 text-sm text-white/70">PIN 4자리를 입력하세요</p>
        </div>

        <div className="flex gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={isPending}
              autoFocus={i === 0}
              aria-label={`PIN ${i + 1}번째 자리`}
              className="size-14 rounded-xl border border-white/20 bg-white/10 text-center text-2xl font-bold text-white tabular-nums backdrop-blur-sm transition-colors focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/40 disabled:opacity-50"
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">{error}</p>
        )}

        {isPending && (
          <p className="text-sm text-white/60">확인 중...</p>
        )}
      </div>
    </div>
  );
}
