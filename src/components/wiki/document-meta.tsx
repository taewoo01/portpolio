"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STATUS_BADGE_CLASS, STATUS_LABEL } from "@/lib/wiki";
import { TagEditor } from "./tag-editor";
import type { DocumentStatus } from "@/generated/prisma/client";

const STATUS_VALUES = Object.keys(STATUS_LABEL) as DocumentStatus[];

export function StatusBadge({ status, className }: { status: DocumentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_BADGE_CLASS[status],
        className
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function DocumentMeta({
  status,
  onStatusChange,
  defaultTags,
  updatedAt,
}: {
  status: DocumentStatus;
  onStatusChange: (status: DocumentStatus) => void;
  defaultTags: string[];
  updatedAt: Date;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Select
          name="status"
          value={status}
          onValueChange={(value) => onStatusChange(value as DocumentStatus)}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {STATUS_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <StatusBadge status={status} />
      </div>

      <TagEditor name="tags" defaultValue={defaultTags} />

      <span className="ml-auto shrink-0 text-xs">
        수정: {updatedAt.toLocaleString("ko-KR")}
      </span>
    </div>
  );
}
