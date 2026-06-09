import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";

export async function getEventsInRange(start: Date, end: Date) {
  return prisma.event.findMany({
    where: {
      startAt: { lte: end },
      OR: [{ endAt: { gte: start } }, { endAt: null, startAt: { gte: start } }],
    },
    orderBy: { startAt: "asc" },
  });
}

export async function getTodayEvents() {
  const now = new Date();
  return getEventsInRange(startOfDay(now), endOfDay(now));
}

export async function getTodosForDate(date: Date) {
  return prisma.todo.findMany({
    where: { dueDate: { gte: startOfDay(date), lte: endOfDay(date) } },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { sortOrder: "asc" }],
  });
}

export async function getPendingTodos(limit = 20) {
  return prisma.todo.findMany({
    where: { completed: false },
    orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }],
    take: limit,
  });
}

export async function getAllTodos() {
  return prisma.todo.findMany({
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { sortOrder: "asc" }],
  });
}
