"use client";

import { useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatContent } from "@/components/timer/float-content";
import { useFloatingTimer } from "@/lib/floating-timer-context";
import { useTimer } from "@/lib/timer-store";

interface DocumentPiP {
  requestWindow(options?: { width?: number; height?: number; disallowReturnToOpener?: boolean }): Promise<Window>;
  readonly window: Window | null;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPiP;
  }
}

export function FloatButton() {
  const { isOpen, open: openInPage, close: closeInPage } = useFloatingTimer();
  const { start, pause, resume, stop } = useTimer();
  const pipWindowRef = useRef<Window | null>(null);
  const rootRef = useRef<Root | null>(null);

  const pipActive = Boolean(pipWindowRef.current && !pipWindowRef.current.closed);

  async function handleOpen() {
    // Electron: IPC로 플로팅 창 열기 (이미 열려 있으면 main.js에서 포커스 처리)
    if (window.electronAPI?.isElectron) {
      await window.electronAPI.openFloatTimer();
      return;
    }

    // PiP가 이미 열려 있으면 포커스
    if (pipActive) {
      pipWindowRef.current!.focus();
      return;
    }

    // 인페이지가 이미 열려 있으면 닫기
    if (isOpen) {
      closeInPage();
      return;
    }

    // 1순위: Document Picture-in-Picture (주소창 없음 + 다른 사이트 위에도 표시)
    if (window.documentPictureInPicture) {
      let pipWindow: Window | null = null;
      try {
        pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 300,
          height: 440,
          disallowReturnToOpener: false,
        });
      } catch {
        // 사용자 거부 또는 미지원 → 인페이지로 폴백
      }

      if (pipWindow) {
        pipWindowRef.current = pipWindow;

        // 스타일 복사
        document.querySelectorAll<Element>('style, link[rel="stylesheet"]').forEach((el) => {
          pipWindow!.document.head.appendChild(el.cloneNode(true));
        });
        const baseStyle = pipWindow.document.createElement("style");
        baseStyle.textContent = "*, *::before, *::after { box-sizing: border-box; } html, body { margin: 0; padding: 0; overflow: hidden; }";
        pipWindow.document.head.appendChild(baseStyle);

        const container = pipWindow.document.createElement("div");
        pipWindow.document.body.appendChild(container);

        const root = createRoot(container);
        rootRef.current = root;
        root.render(
          <FloatContent
            onClose={() => { root.unmount(); pipWindow!.close(); }}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onStop={stop}
          />
        );

        pipWindow.addEventListener("pagehide", () => {
          rootRef.current?.unmount();
          rootRef.current = null;
          pipWindowRef.current = null;
        });

        return;
      }
    }

    // 2순위: 인페이지 플로팅 위젯 (주소창 없음, 동일 탭 내 유지)
    openInPage();
  }

  return (
    <Button
      variant={isOpen || pipActive ? "default" : "outline"}
      size="sm"
      onClick={handleOpen}
      className="gap-1.5"
    >
      <PictureInPicture2 className="size-4" />
      분리
    </Button>
  );
}
