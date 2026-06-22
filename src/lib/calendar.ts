import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { visibilityWhere } from "@/lib/auth";
import type { User } from "@/lib/auth";

export async function getEventsInRange(start: Date, end: Date, currentUser: User | null = null) {
  const visibility = visibilityWhere(currentUser);
  return prisma.event.findMany({
    where: {
      startAt: { lte: end },
      OR: [{ endAt: { gte: start } }, { endAt: null, startAt: { gte: start } }],
      ...(visibility ? { AND: [visibility] } : {}),
    },
    orderBy: { startAt: "asc" },
  });
}

export async function getTodayEvents(currentUser: User | null = null) {
  const now = new Date();
  return getEventsInRange(startOfDay(now), endOfDay(now), currentUser);
}

export async function getTodosForDate(date: Date, currentUser: User | null = null) {
  return prisma.todo.findMany({
    where: {
      dueDate: { gte: startOfDay(date), lte: endOfDay(date) },
      ...visibilityWhere(currentUser),
    },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { sortOrder: "asc" }],
  });
}

export async function getPendingTodos(limit = 20, currentUser: User | null = null) {
  return prisma.todo.findMany({
    where: { completed: false, ...visibilityWhere(currentUser) },
    orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }],
    take: limit,
  });
}

export async function getAllTodos(currentUser: User | null = null) {
  return prisma.todo.findMany({
    where: visibilityWhere(currentUser),
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { sortOrder: "asc" }],
  });
}
