"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TagEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string[];
}) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const value = draft.trim();
    setDraft("");
    if (!value || tags.includes(value)) return;
    setTags((prev) => [...prev, value]);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div className="flex min-w-48 flex-1 flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} readOnly />
      ))}
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`${tag} 태그 삭제`}
            className="rounded-full hover:bg-background/60"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder="태그 입력 후 Enter"
        className="h-7 w-32 border-none px-1.5 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
