"use client";

import { useEffect, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { codeToHtml } from "shiki";
import { XIcon } from "lucide-react";

const highlightCache = new Map<string, string>();

const SHIKI_OPTIONS = {
  themes: { light: "github-light", dark: "github-dark" },
} as const;

function CodeBlock({ className, children }: { className?: string; children?: ReactNode }) {
  const code = String(children).replace(/\n$/, "");
  const lang = /language-(\S+)/.exec(className ?? "")?.[1] ?? "text";
  const cacheKey = `${lang} ${code}`;
  const [html, setHtml] = useState<string | null>(highlightCache.get(cacheKey) ?? null);

  useEffect(() => {
    if (highlightCache.has(cacheKey)) {
      setHtml(highlightCache.get(cacheKey)!);
      return;
    }

    let cancelled = false;
    codeToHtml(code, { lang, ...SHIKI_OPTIONS })
      .then((result) => {
        if (cancelled) return;
        highlightCache.set(cacheKey, result);
        setHtml(result);
      })
      .catch(() => {
        // unsupported language — keep plain rendering
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, code, lang]);

  if (html) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 text-sm">
      <code>{code}</code>
    </pre>
  );
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <XIcon className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

export function MarkdownPreview({ content, lightbox = false }: { content: string; lightbox?: boolean }) {
  const [zoomed, setZoomed] = useState<{ src: string; alt: string } | null>(null);

  if (!content.trim()) {
    return <p className="text-sm text-muted-foreground">내용이 없습니다.</p>;
  }

  function extractText(node: React.ReactNode): string {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node && typeof node === "object" && "props" in node) {
      return extractText((node as { props: { children?: React.ReactNode } }).props.children);
    }
    return "";
  }

  function headingId(node: React.ReactNode): string {
    const text = extractText(node).trim().toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
    return text || "heading";
  }

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-img:inline-block">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, defaultSchema], rehypeKatex]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children }) {
            const isBlock = className || String(children).includes("\n");
            if (!isBlock) {
              return <code className="rounded bg-muted px-1.5 py-0.5">{children}</code>;
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          h1({ children }) { return <h1 id={headingId(children)}>{children}</h1>; },
          h2({ children }) { return <h2 id={headingId(children)}>{children}</h2>; },
          h3({ children }) { return <h3 id={headingId(children)}>{children}</h3>; },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            );
          },
          img({ src, alt }) {
            const url = typeof src === "string" ? src : undefined;
            if (!lightbox || !url) {
              // eslint-disable-next-line @next/next/no-img-element
              return <img src={url} alt={alt ?? ""} />;
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={alt ?? ""}
                className="cursor-zoom-in transition-opacity hover:opacity-90"
                onClick={() => setZoomed({ src: url, alt: alt ?? "" })}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {zoomed && (
        <ImageLightbox src={zoomed.src} alt={zoomed.alt} onClose={() => setZoomed(null)} />
      )}
    </div>
  );
}
