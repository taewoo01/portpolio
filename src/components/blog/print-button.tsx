"use client";

import { useState } from "react";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function PrintButton({ slug }: { slug: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}/pdf`);
      if (!res.ok) throw new Error();
      const filename = res.headers
        .get("content-disposition")
        ?.match(/filename="(.+)"/)?.[1];
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ? decodeURIComponent(filename) : `${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.add({ title: "PDF 생성에 실패했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="print:hidden"
    >
      {loading ? (
        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
      ) : (
        <Printer className="mr-1.5 size-3.5" />
      )}
      {loading ? "생성 중..." : "PDF로 내보내기"}
    </Button>
  );
}
