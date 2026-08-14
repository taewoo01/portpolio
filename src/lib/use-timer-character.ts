"use client";

import { useEffect, useState } from "react";

export const DEFAULT_TIMER_CHARACTER_URL = "/doraemon.gif";

export function isAnimatedCharacter(url: string): boolean {
  return url.split(/[?#]/)[0].toLowerCase().endsWith(".gif");
}

export function useTimerCharacterUrl() {
  const [url, setUrl] = useState(DEFAULT_TIMER_CHARACTER_URL);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/timer-character")
      .then((res) => res.json())
      .then((data: { url: string | null; enabled: boolean }) => {
        if (!cancelled && data.url && data.enabled) setUrl(data.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return url;
}
