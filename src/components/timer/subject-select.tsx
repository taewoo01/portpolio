"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SubjectManagerDialog } from "./subject-manager-dialog";
import type { StudySubjectModel } from "@/generated/prisma/models";

const NONE_VALUE = "__none__";

export function SubjectSelect({
  subjects,
  value,
  onChange,
  disabled,
}: {
  subjects: StudySubjectModel[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [managerOpen, setManagerOpen] = useState(false);

  return (
    <>
      <div className="flex gap-1.5">
        <Select
          value={value ?? NONE_VALUE}
          onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
          disabled={disabled}
        >
          <SelectTrigger className="w-32 shrink-0">
            <SelectValue placeholder="과목">
              {(v: string) => {
                if (v === NONE_VALUE || !v) return "과목 없음";
                const subject = subjects.find((s) => s.id === v);
                if (!subject) return "과목 없음";
                return (
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                    {subject.name}
                  </span>
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>과목 없음</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setManagerOpen(true)}
          disabled={disabled}
          aria-label="과목 관리"
          className="shrink-0"
        >
          <Settings2 className="size-4" />
        </Button>
      </div>
      <SubjectManagerDialog open={managerOpen} onOpenChange={setManagerOpen} subjects={subjects} />
    </>
  );
}
