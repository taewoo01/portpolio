"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { saveTimerCharacterAction } from "@/lib/actions/about";
import { DEFAULT_TIMER_CHARACTER_URL } from "@/lib/use-timer-character";
import { useToast } from "@/components/ui/toast";

export function CharacterPicker({
  initialUrl,
  initialEnabled,
}: {
  initialUrl: string | null;
  initialEnabled: boolean;
}) {
  const toast = useToast();
  const [url, setUrl] = useState(initialUrl);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = url && enabled ? url : DEFAULT_TIMER_CHARACTER_URL;

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { url: uploadedUrl } = await res.json();
      setUrl(uploadedUrl);
      setEnabled(true);
      await saveTimerCharacterAction({ url: uploadedUrl, enabled: true });
    } catch {
      toast.add({ title: "이미지 업로드에 실패했습니다.", type: "error" });
    } finally {
      setUploading(false);
    }
  }

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    saveTimerCharacterAction({ enabled: next });
  }

  function handleRemove() {
    setUrl(null);
    setEnabled(true);
    saveTimerCharacterAction({ url: null, enabled: true });
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="focus-ring group relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted"
        aria-label="타이머 캐릭터 이미지 업로드"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayUrl} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/50 py-0.5 opacity-100 transition-opacity group-hover:opacity-0">
            <ImagePlus className="size-3 text-white" />
          </span>
          <ImagePlus className="size-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </button>

      {url && (
        <>
          <button
            type="button"
            onClick={handleToggle}
            className="focus-ring rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {enabled ? "기본으로" : "내 캐릭터로"}
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="focus-ring rounded text-muted-foreground hover:text-destructive"
            aria-label="업로드한 캐릭터 삭제"
          >
            <Trash2 className="size-3.5" />
          </button>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
