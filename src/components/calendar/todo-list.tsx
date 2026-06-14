"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createTodoAction, deleteTodoAction, toggleTodoCompleteAction } from "@/lib/actions/todos";
import { TASK_WORKSPACE_BADGE_CLASS, TASK_WORKSPACE_LABEL, TASK_WORKSPACE_VALUES } from "@/lib/workspace";
import { USER_LABEL, isOwner } from "@/lib/auth";
import type { TaskWorkspace } from "@/generated/prisma/client";
import type { TodoModel } from "@/generated/prisma/models";
import type { User } from "@/lib/auth";

export function TodoList({ todos, currentUser }: { todos: TodoModel[]; currentUser: User | null }) {
  const [workspace, setWorkspace] = useState<TaskWorkspace>("dev");
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createTodoAction(formData);
      if (result?.error) console.error(result.error);
    });
  }

  function handleToggle(todo: TodoModel, completed: boolean) {
    startTransition(async () => {
      const result = await toggleTodoCompleteAction(todo.id, completed);
      if (result?.error) console.error(result.error);
    });
  }

  function handleDelete(todo: TodoModel) {
    if (!window.confirm(`"${todo.title}" 할 일을 삭제할까요?`)) return;
    startTransition(async () => {
      const result = await deleteTodoAction(todo.id);
      if (result?.error) console.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">할 일</h2>

      <form action={handleCreate} className="flex flex-col gap-2 rounded-md border p-3">
        <Input name="title" placeholder="할 일 제목" required />
        <div className="flex gap-2">
          <Input name="dueDate" type="date" className="flex-1" />
          <Select
            name="workspace"
            value={workspace}
            onValueChange={(value) => setWorkspace(value as TaskWorkspace)}
          >
            <SelectTrigger className="w-28">
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
          <Button type="submit" disabled={isPending}>
            추가
          </Button>
        </div>
      </form>

      <ul className="flex flex-col gap-1">
        {todos.map((todo) => {
            const canDelete = isOwner(currentUser, todo.createdBy ?? null);
            return (
              <li
                key={todo.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                  todo.completed && "opacity-50"
                )}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={(checked) => handleToggle(todo, checked === true)}
                />
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    TASK_WORKSPACE_BADGE_CLASS[todo.workspace]
                  )}
                >
                  {TASK_WORKSPACE_LABEL[todo.workspace]}
                </span>
                <span className={cn("flex-1 truncate", todo.completed && "line-through")}>{todo.title}</span>
                {todo.createdBy && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {USER_LABEL[todo.createdBy as User]}
                  </span>
                )}
                {todo.dueDate && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {todo.dueDate.toLocaleDateString("ko-KR")}
                  </span>
                )}
                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(todo)}
                    aria-label="할 일 삭제"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
