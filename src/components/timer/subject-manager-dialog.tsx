"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createStudySubjectAction, deleteStudySubjectAction } from "@/lib/actions/study-subjects";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { StudySubjectModel } from "@/generated/prisma/models";

const COLOR_PALETTE = ["#3182F6", "#a855f7", "#22c55e", "#f97316", "#ef4444", "#ec4899", "#eab308", "#14b8a6"];

export function SubjectManagerDialog({
  open,
  onOpenChange,
  subjects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: StudySubjectModel[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[0]);

  function handleCreate() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createStudySubjectAction(name.trim(), color);
      if ("error" in result) { toast.add({ title: result.error, type: "error" }); return; }
      setName("");
      setColor(COLOR_PALETTE[0]);
      router.refresh();
    });
  }

  async function handleDelete(subject: StudySubjectModel) {
    const ok = await confirm({
      title: "과목 삭제",
      description: `"${subject.name}" 과목을 삭제할까요? 기록된 공부 시간은 유지되고 "미분류"로 표시됩니다.`,
      confirmText: "삭제",
      variant: "destructive",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteStudySubjectAction(subject.id);
      if (result?.error) { toast.add({ title: result.error, type: "error" }); return; }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>과목 관리</DialogTitle>
          <DialogDescription>타이머를 시작할 때 고를 과목을 만들고 정리하세요.</DialogDescription>
        </DialogHeader>

        {subjects.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="flex-1 truncate">{s.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(s)}
                  disabled={isPending}
                  className="focus-ring rounded p-1 text-muted-foreground hover:text-destructive"
                  aria-label={`${s.name} 삭제`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 border-t pt-3">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="새 과목 이름"
              disabled={isPending}
            />
            <Button type="button" onClick={handleCreate} disabled={isPending || !name.trim()} className="shrink-0">
              <Plus className="size-4" />
              추가
            </Button>
          </div>
          <div className="flex gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`색상 ${c}`}
                className="focus-ring relative size-6 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
