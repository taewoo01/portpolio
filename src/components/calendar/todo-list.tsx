"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { deleteTodoAction, toggleTodoCompleteAction } from "@/lib/actions/todos";
import { TASK_WORKSPACE_BADGE_CLASS, TASK_WORKSPACE_LABEL } from "@/lib/workspace";
import { USER_LABEL, isOwner } from "@/lib/auth";
import { EventDialog } from "./event-dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { TodoModel } from "@/generated/prisma/models";
import type { User } from "@/lib/auth";

export function TodoList({ todos, currentUser }: { todos: TodoModel[]; currentUser: User | null }) {
  const confirm = useConfirm();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleToggle(todo: TodoModel, completed: boolean) {
    startTransition(async () => {
      const result = await toggleTodoCompleteAction(todo.id, completed);
      if (result?.error) toast.add({ title: result.error, type: "error" });
    });
  }

  async function handleDelete(todo: TodoModel) {
    const ok = await confirm({
      title: "할 일 삭제",
      description: `"${todo.title}" 할 일을 삭제할까요?`,
      confirmText: "삭제",
      variant: "destructive",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteTodoAction(todo.id);
      if (result?.error) toast.add({ title: result.error, type: "error" });
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">할 일</h2>
        <Button type="button" size="sm" className="shrink-0" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          할 일 추가
        </Button>
      </div>

      {todos.length === 0 ? (
        <div className="flex h-16 items-center justify-center gap-2 rounded-xl bg-muted/40 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-muted-foreground/50" />
          할 일이 없습니다
        </div>
      ) : (
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
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={null}
        defaultStart={null}
        defaultType="todo"
        currentUser={currentUser}
      />
    </div>
  );
}
