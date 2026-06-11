"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEventAction, deleteEventAction, updateEventAction } from "@/lib/actions/events";
import { TASK_WORKSPACE_LABEL, TASK_WORKSPACE_VALUES } from "@/lib/workspace";
import type { TaskWorkspace } from "@/generated/prisma/client";
import type { EventModel } from "@/generated/prisma/models";
import type { User } from "@/lib/auth";

function toLocalInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  defaultStart,
  currentUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventModel | null;
  defaultStart: Date | null;
  currentUser: User | null;
}) {
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [workspace, setWorkspace] = useState<TaskWorkspace>(event?.workspace ?? "dev");
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (!open) return;
    setAllDay(event?.allDay ?? false);
    setWorkspace(event?.workspace ?? "dev");
  }, [event, open]);

  const isEditing = Boolean(event);
  const startBase = event?.startAt ?? defaultStart;
  const startValue = startBase
    ? allDay
      ? toLocalInputValue(startBase).slice(0, 10)
      : toLocalInputValue(startBase)
    : "";
  const endValue = event?.endAt
    ? allDay
      ? toLocalInputValue(event.endAt).slice(0, 10)
      : toLocalInputValue(event.endAt)
    : "";

  function handleSubmit(formData: FormData) {
    startSave(async () => {
      const result = event
        ? await updateEventAction(event.id, formData)
        : await createEventAction(formData);
      if (result?.error) { console.error(result.error); return; }
      onOpenChange(false);
    });
  }

  function handleDelete() {
    if (!event) return;
    if (!window.confirm(`"${event.title}" 일정을 삭제할까요?`)) return;
    startDelete(async () => {
      const result = await deleteEventAction(event.id);
      if (result?.error) { console.error(result.error); return; }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "일정 수정" : "일정 추가"}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          {/* 클라이언트 timezone offset 전달 (서버의 UTC 파싱 보정용) */}
          <input type="hidden" name="tzOffset" value={String(new Date().getTimezoneOffset())} readOnly />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">제목</Label>
            <Input id="event-title" name="title" defaultValue={event?.title} placeholder="일정 제목" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-description">설명</Label>
            <Textarea
              id="event-description"
              name="description"
              defaultValue={event?.description ?? ""}
              placeholder="설명 (선택)"
              className="min-h-20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="event-allday"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <input type="hidden" name="allDay" value={allDay ? "on" : ""} readOnly />
            <Label htmlFor="event-allday">하루 종일</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-start">시작</Label>
              <Input
                key={`start-${allDay}`}
                id="event-start"
                name="startAt"
                type={allDay ? "date" : "datetime-local"}
                defaultValue={startValue}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-end">종료 (선택)</Label>
              <Input
                key={`end-${allDay}`}
                id="event-end"
                name="endAt"
                type={allDay ? "date" : "datetime-local"}
                defaultValue={endValue}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>워크스페이스</Label>
            <Select
              name="workspace"
              value={workspace}
              onValueChange={(value) => setWorkspace(value as TaskWorkspace)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_WORKSPACE_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {TASK_WORKSPACE_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            {isEditing && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                삭제
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              {isEditing ? "저장" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
