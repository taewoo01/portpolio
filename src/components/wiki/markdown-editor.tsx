"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "./markdown-preview";
import { MarkdownToolbar } from "./markdown-toolbar";

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
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
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
        textarea?.focus();
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

      <div className={cn("grid flex-1 gap-4", mode === "split" && "grid-cols-2")}>
        {mode !== "preview" && (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="마크다운으로 내용을 작성하세요&#10;&#10;수식: $x^2 + y^2 = r^2$ 또는 $$\sum_{i=0}^{n} i$$"
            className="min-h-[60vh] flex-1 resize-none font-mono text-sm"
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
