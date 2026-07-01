"use client";

import { useRef, type RefObject } from "react";
import { Bold, Code, Heading1, Heading2, Heading3, ImagePlus, Italic, List, Pilcrow, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

type Selection = { content: string; start: number; end: number };

function transformSelectedLines(
  content: string,
  start: number,
  end: number,
  transform: (line: string) => string
): Selection {
  const lineStart = content.lastIndexOf("\n", start - 1) + 1;
  const lineEndIdx = content.indexOf("\n", end);
  const lineEnd = lineEndIdx === -1 ? content.length : lineEndIdx;

  const block = content.slice(lineStart, lineEnd);
  const newBlock = block.split("\n").map(transform).join("\n");

  return {
    content: content.slice(0, lineStart) + newBlock + content.slice(lineEnd),
    start: lineStart,
    end: lineStart + newBlock.length,
  };
}

export function wrapSelection(
  content: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string
): Selection {
  const selected = content.slice(start, end);
  const text = selected || placeholder;
  const newStart = start + before.length;

  return {
    content: content.slice(0, start) + before + text + after + content.slice(end),
    start: newStart,
    end: newStart + text.length,
  };
}

function insertCodeBlock(content: string, start: number, end: number): Selection {
  const selected = content.slice(start, end);
  const needsLeadingNewline = start > 0 && content[start - 1] !== "\n";
  const needsTrailingNewline = end < content.length && content[end] !== "\n";
  const opening = "```typescript\n";
  const closing = "\n```";
  const block = `${needsLeadingNewline ? "\n" : ""}${opening}${selected}${closing}${
    needsTrailingNewline ? "\n" : ""
  }`;
  const cursor = start + (needsLeadingNewline ? 1 : 0) + opening.length + selected.length;

  return {
    content: content.slice(0, start) + block + content.slice(end),
    start: cursor,
    end: cursor,
  };
}

const HEADING_PATTERN = /^#{1,6}\s*/;
const PLAIN_PATTERN = /^(#{1,6}|>|-)\s+/;

type ToolbarButton = {
  label: string;
  icon: typeof Bold;
  apply: (content: string, start: number, end: number) => Selection;
};

const BUTTONS: ToolbarButton[] = [
  {
    label: "H1",
    icon: Heading1,
    apply: (content, start, end) =>
      transformSelectedLines(content, start, end, (line) => `# ${line.replace(HEADING_PATTERN, "")}`),
  },
  {
    label: "H2",
    icon: Heading2,
    apply: (content, start, end) =>
      transformSelectedLines(content, start, end, (line) => `## ${line.replace(HEADING_PATTERN, "")}`),
  },
  {
    label: "H3",
    icon: Heading3,
    apply: (content, start, end) =>
      transformSelectedLines(content, start, end, (line) => `### ${line.replace(HEADING_PATTERN, "")}`),
  },
  {
    label: "본문",
    icon: Pilcrow,
    apply: (content, start, end) =>
      transformSelectedLines(content, start, end, (line) => line.replace(PLAIN_PATTERN, "")),
  },
  {
    label: "굵게",
    icon: Bold,
    apply: (content, start, end) => wrapSelection(content, start, end, "**", "**", "굵은 텍스트"),
  },
  {
    label: "기울임",
    icon: Italic,
    apply: (content, start, end) => wrapSelection(content, start, end, "*", "*", "기울임 텍스트"),
  },
  {
    label: "코드",
    icon: Code,
    apply: (content, start, end) => insertCodeBlock(content, start, end),
  },
  {
    label: "인용",
    icon: Quote,
    apply: (content, start, end) =>
      transformSelectedLines(content, start, end, (line) => `> ${line.replace(/^>\s*/, "")}`),
  },
  {
    label: "목록",
    icon: List,
    apply: (content, start, end) =>
      transformSelectedLines(content, start, end, (line) => `- ${line.replace(/^-\s*/, "")}`),
  },
];

export function MarkdownToolbar({
  textareaRef,
  content,
  onChange,
  onImageUpload,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  onChange: (next: string) => void;
  onImageUpload?: (file: File) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClick(button: ToolbarButton) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const result = button.apply(content, selectionStart, selectionEnd);

    onChange(result.content);
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(result.start, result.end);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;
    await onImageUpload(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-wrap gap-1">
      {BUTTONS.map((button) => (
        <Button
          key={button.label}
          type="button"
          size="sm"
          variant="ghost"
          title={button.label}
          aria-label={button.label}
          onClick={() => handleClick(button)}
        >
          <button.icon className="size-4" />
          <span className="hidden sm:inline">{button.label}</span>
        </Button>
      ))}
      {onImageUpload && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            title="이미지 업로드"
            aria-label="이미지 업로드"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            <span className="hidden sm:inline">이미지</span>
          </Button>
        </>
      )}
    </div>
  );
}
