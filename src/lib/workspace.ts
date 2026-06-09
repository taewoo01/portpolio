import type { TaskWorkspace } from "@/generated/prisma/client";

export const TASK_WORKSPACE_LABEL: Record<TaskWorkspace, string> = {
  dev: "개발",
  competition: "공모전",
  study: "공부",
  exam: "시험",
  appointment: "약속",
  exercise: "운동",
  other: "기타",
};

export const TASK_WORKSPACE_BADGE_CLASS: Record<TaskWorkspace, string> = {
  dev: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  competition: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
  study: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  exam: "bg-red-500/15 text-red-700 dark:text-red-400",
  appointment: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  exercise: "bg-green-500/15 text-green-700 dark:text-green-400",
  other: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400",
};

export const TASK_WORKSPACE_DOT_CLASS: Record<TaskWorkspace, string> = {
  dev: "bg-blue-500",
  competition: "bg-pink-500",
  study: "bg-purple-500",
  exam: "bg-red-500",
  appointment: "bg-orange-500",
  exercise: "bg-green-500",
  other: "bg-zinc-400",
};

export const TASK_WORKSPACE_VALUES = Object.keys(TASK_WORKSPACE_LABEL) as TaskWorkspace[];
