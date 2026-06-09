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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col gap-2">
      {/* content is always submitted via this hidden field, regardless of view mode */}
      <input type="hidden" name={name} value={value} readOnly />

      <div className="flex flex-wrap items-center justify-between gap-2">
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
          <MarkdownToolbar textareaRef={textareaRef} content={value} onChange={onChange} />
        )}
      </div>

      <div className={cn("grid flex-1 gap-4", mode === "split" && "grid-cols-2")}>
        {mode !== "preview" && (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="마크다운으로 내용을 작성하세요"
            className="min-h-[60vh] flex-1 resize-none font-mono text-sm"
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
