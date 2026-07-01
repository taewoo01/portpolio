"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "./markdown-preview";
import { MarkdownToolbar, wrapSelection } from "./markdown-toolbar";

const MODES = [
  { value: "edit", label: "편집" },
  { value: "preview", label: "미리보기" },
  { value: "split", label: "분할" },
] as const;

type Mode = (typeof MODES)[number]["value"];

export function MarkdownEditor({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("edit");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    const ctrl = event.ctrlKey || event.metaKey;

    // Ctrl/Cmd+S → 저장
    if (ctrl && event.key.toLowerCase() === "s") {
      event.preventDefault();
      textarea.form?.requestSubmit();
      return;
    }

    // Ctrl/Cmd+B → 굵게
    if (ctrl && event.key.toLowerCase() === "b") {
      event.preventDefault();
      const r = wrapSelection(value, selectionStart, selectionEnd, "**", "**", "굵은 텍스트");
      onChange(r.content);
      requestAnimationFrame(() => textarea.setSelectionRange(r.start, r.end));
      return;
    }

    // Ctrl/Cmd+I → 기울임
    if (ctrl && event.key.toLowerCase() === "i") {
      event.preventDefault();
      const r = wrapSelection(value, selectionStart, selectionEnd, "*", "*", "기울임 텍스트");
      onChange(r.content);
      requestAnimationFrame(() => textarea.setSelectionRange(r.start, r.end));
      return;
    }

    // Ctrl/Cmd+` → 인라인 코드
    if (ctrl && event.key === "`") {
      event.preventDefault();
      const r = wrapSelection(value, selectionStart, selectionEnd, "`", "`", "코드");
      onChange(r.content);
      requestAnimationFrame(() => textarea.setSelectionRange(r.start, r.end));
      return;
    }

    // Tab / Shift+Tab → 들여쓰기 / 내어쓰기
    if (event.key === "Tab") {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;

      if (!event.shiftKey) {
        if (selectionStart === selectionEnd) {
          // 커서 위치에 공백 2칸 삽입
          const next = value.slice(0, selectionStart) + "  " + value.slice(selectionStart);
          onChange(next);
          requestAnimationFrame(() => textarea.setSelectionRange(selectionStart + 2, selectionStart + 2));
        } else {
          // 선택 영역 각 줄 들여쓰기
          const lineEnd = (() => { const i = value.indexOf("\n", selectionEnd); return i === -1 ? value.length : i; })();
          const indented = value.slice(lineStart, lineEnd).split("\n").map((l) => "  " + l).join("\n");
          onChange(value.slice(0, lineStart) + indented + value.slice(lineEnd));
          requestAnimationFrame(() => textarea.setSelectionRange(lineStart, lineStart + indented.length));
        }
      } else {
        if (selectionStart === selectionEnd) {
          // 현재 줄 내어쓰기
          const removed = value.slice(lineStart).match(/^ {1,2}/)?.[0].length ?? 0;
          if (removed > 0) {
            onChange(value.slice(0, lineStart) + value.slice(lineStart + removed));
            requestAnimationFrame(() => {
              const p = Math.max(lineStart, selectionStart - removed);
              textarea.setSelectionRange(p, p);
            });
          }
        } else {
          // 선택 영역 각 줄 내어쓰기
          const lineEnd = (() => { const i = value.indexOf("\n", selectionEnd); return i === -1 ? value.length : i; })();
          const unindented = value.slice(lineStart, lineEnd).split("\n").map((l) => l.replace(/^ {1,2}/, "")).join("\n");
          onChange(value.slice(0, lineStart) + unindented + value.slice(lineEnd));
          requestAnimationFrame(() => textarea.setSelectionRange(lineStart, lineStart + unindented.length));
        }
      }
      return;
    }

    // Enter → 목록(- )/인용(> ) 자동 이어쓰기
    if (event.key === "Enter" && !ctrl && !event.shiftKey && selectionStart === selectionEnd) {
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const lineEndPos = value.indexOf("\n", lineStart);
      const lineEnd = lineEndPos === -1 ? value.length : lineEndPos;

      // 줄 끝에서 Enter를 눌렀을 때만 적용
      if (selectionStart === lineEnd) {
        const currentLine = value.slice(lineStart, lineEnd);
        const listMatch = currentLine.match(/^(\s*- )(.*)/);
        const quoteMatch = listMatch ? null : currentLine.match(/^(> )(.*)/);
        const prefix = listMatch?.[1] ?? quoteMatch?.[1] ?? null;
        const lineContent = listMatch?.[2] ?? quoteMatch?.[2] ?? null;

        if (prefix !== null && lineContent !== null) {
          event.preventDefault();
          if (lineContent === "") {
            // 빈 항목 → 목록/인용 종료, prefix 제거
            onChange(value.slice(0, lineStart) + value.slice(lineEnd));
            requestAnimationFrame(() => textarea.setSelectionRange(lineStart, lineStart));
          } else {
            // 다음 줄에 동일한 prefix 자동 삽입
            const insertion = "\n" + prefix;
            onChange(value.slice(0, selectionStart) + insertion + value.slice(selectionStart));
            requestAnimationFrame(() => {
              const p = selectionStart + insertion.length;
              textarea.setSelectionRange(p, p);
            });
          }
        }
      }
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      const textarea = textareaRef.current;
      const cursor = textarea?.selectionStart ?? value.length;
      const insertion = `![${file.name}](${url})`;
      onChange(value.slice(0, cursor) + insertion + value.slice(cursor));

      requestAnimationFrame(() => {
        textarea?.focus({ preventScroll: true });
        const pos = cursor + insertion.length;
        textarea?.setSelectionRange(pos, pos);
      });
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col gap-2">
      <input type="hidden" name={name} value={value} readOnly />

      {/* sticky 툴바 */}
      <div className="sticky top-14 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/95 px-1 py-1.5 backdrop-blur-sm">
        <div className="flex gap-1">
          {MODES.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={mode === item.value ? "secondary" : "ghost"}
              onClick={() => setMode(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {mode !== "preview" && (
          <MarkdownToolbar
            textareaRef={textareaRef}
            content={value}
            onChange={onChange}
            onImageUpload={uploading ? undefined : handleImageUpload}
          />
        )}
      </div>

      <div className={cn("grid flex-1 gap-4", mode === "split" && "md:grid-cols-2")}>
        {mode !== "preview" && (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="마크다운으로 내용을 작성하세요&#10;&#10;수식: $x^2 + y^2 = r^2$ 또는 $$\sum_{i=0}^{n} i$$"
            className="min-h-[60dvh] flex-1 resize-none font-mono text-sm [field-sizing:fixed] overflow-y-auto md:[field-sizing:content] md:overflow-visible"
            disabled={uploading}
          />
        )}
        {mode !== "edit" && (
          <div className="min-h-[60vh] flex-1 overflow-y-auto rounded-md border px-4 py-3">
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>
    </div>
  );
}
