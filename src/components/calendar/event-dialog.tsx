"use client";

import { useEffect, useState, useTransition } from "react";
import { getDay } from "date-fns";
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
import { cn } from "@/lib/utils";
import { createEventAction, deleteEventAction, updateEventAction } from "@/lib/actions/events";
import { TASK_WORKSPACE_LABEL, TASK_WORKSPACE_VALUES } from "@/lib/workspace";
import type { TaskWorkspace } from "@/generated/prisma/client";
import type { EventModel } from "@/generated/prisma/models";
import type { User } from "@/lib/auth";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toLocalInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function parseWeekdays(recurrence: string | null, fallbackDate: Date | null): number[] {
  if (!recurrence?.startsWith("weekly")) return [];
  if (recurrence === "weekly") return fallbackDate ? [getDay(fallbackDate)] : [];
  const match = recurrence.match(/^weekly:(.+)$/);
  return match ? match[1].split(",").map(Number).filter(n => n >= 0 && n <= 6) : [];
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
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startAtValue, setStartAtValue] = useState("");
  const [workspace, setWorkspace] = useState<TaskWorkspace>(event?.workspace ?? "dev");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (!open) return;
    setError(null);
    const isAllDay = event?.allDay ?? false;
    setAllDay(isAllDay);
    setWorkspace(event?.workspace ?? "dev");

    const base = event?.startAt ?? defaultStart;
    if (base) {
      const local = toLocalInputValue(base);
      setStartAtValue(isAllDay ? local.slice(0, 10) : local);
    } else {
      setStartAtValue("");
    }

    const r = event?.recurrence ?? null;
    if (r?.startsWith("weekly")) {
      setWeeklyEnabled(true);
      setWeekdays(parseWeekdays(r, event?.startAt ?? null));
    } else {
      setWeeklyEnabled(false);
      setWeekdays([]);
    }
  }, [event, open, defaultStart]);

  function handleAllDayChange(checked: boolean) {
    setAllDay(checked);
    setStartAtValue(prev => {
      if (checked) return prev.slice(0, 10);
      return prev.length === 10 ? prev + "T00:00" : prev;
    });
  }

  function handleWeeklyToggle(checked: boolean) {
    setWeeklyEnabled(checked);
    if (checked && weekdays.length === 0 && startAtValue) {
      const d = new Date(startAtValue);
      if (!isNaN(d.getTime())) setWeekdays([d.getDay()]);
    }
    if (!checked) setWeekdays([]);
  }

  function toggleWeekday(day: number) {
    setWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  const recurrenceValue =
    weeklyEnabled && weekdays.length > 0
      ? `weekly:${[...weekdays].sort((a, b) => a - b).join(",")}`
      : "";

  const isEditing = Boolean(event);
  const endValue = event?.endAt
    ? allDay
      ? toLocalInputValue(event.endAt).slice(0, 10)
      : toLocalInputValue(event.endAt)
    : "";

  function handleSubmit(formData: FormData) {
    setError(null);
    startSave(async () => {
      const result = event
        ? await updateEventAction(event.id, formData)
        : await createEventAction(formData);
      if (result?.error) { setError(result.error); return; }
      onOpenChange(false);
    });
  }

  function handleDelete() {
    if (!event) return;
    if (!window.confirm(`"${event.title}" 일정을 삭제할까요?`)) return;
    setError(null);
    startDelete(async () => {
      const result = await deleteEventAction(event.id);
      if (result?.error) { setError(result.error); return; }
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

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="event-allday"
                checked={allDay}
                onCheckedChange={(checked) => handleAllDayChange(checked === true)}
              />
              <input type="hidden" name="allDay" value={allDay ? "on" : ""} readOnly />
              <Label htmlFor="event-allday">하루 종일</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="event-recurrence"
                checked={weeklyEnabled}
                onCheckedChange={(checked) => handleWeeklyToggle(checked === true)}
              />
              <input type="hidden" name="recurrence" value={recurrenceValue} readOnly />
              <Label htmlFor="event-recurrence">매주 반복</Label>
            </div>
          </div>

          {weeklyEnabled && (
            <div className="flex flex-col gap-1.5">
              <Label>반복 요일</Label>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleWeekday(i)}
                    className={cn(
                      "size-8 rounded-full text-xs font-medium transition-colors",
                      weekdays.includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {weekdays.length === 0 && (
                <p className="text-xs text-destructive">요일을 하나 이상 선택해주세요.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-start">시작</Label>
              <Input
                id="event-start"
                name="startAt"
                type={allDay ? "date" : "datetime-local"}
                value={startAtValue}
                onChange={(e) => setStartAtValue(e.target.value)}
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

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            {isEditing && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                삭제
              </Button>
            )}
            <Button type="submit" disabled={isSaving || (weeklyEnabled && weekdays.length === 0)}>
              {isEditing ? "저장" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
