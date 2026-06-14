import { prisma } from "@/lib/db";

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getTodaySessions() {
  const { start, end } = todayRange();
  return prisma.studySession.findMany({
    where: { startAt: { gte: start, lte: end }, endAt: { not: null } },
    orderBy: { startAt: "desc" },
  });
}

export async function getActiveSession() {
  return prisma.studySession.findFirst({
    where: { endAt: null },
    orderBy: { startAt: "desc" },
  });
}

export async function getTodayActivity() {
  const { start, end } = todayRange();
  const [documents, blogPosts] = await Promise.all([
    prisma.document.findMany({
      where: { updatedAt: { gte: start, lte: end } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        workspaceCategory: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.blogPost.findMany({
      where: { published: true, publishedAt: { gte: start, lte: end } },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, publishedAt: true },
    }),
  ]);
  return { documents, blogPosts };
}

export async function getWeeklyStats() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const sessions = await prisma.studySession.findMany({
    where: { startAt: { gte: start, lte: end }, duration: { not: null } },
    select: { startAt: true, duration: true },
  });

  return buildDailyStats(sessions, start, 7);
}

export async function getMonthlyStats() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const end = new Date(now.getFullYear(), now.getMonth(), daysInMonth, 23, 59, 59, 999);

  const sessions = await prisma.studySession.findMany({
    where: { startAt: { gte: start, lte: end }, duration: { not: null } },
    select: { startAt: true, duration: true },
  });

  return buildDailyStats(sessions, start, daysInMonth);
}

function buildDailyStats(
  sessions: { startAt: Date; duration: number | null }[],
  start: Date,
  days: number
) {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = s.startAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + (s.duration ?? 0));
  }

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, seconds: map.get(key) ?? 0 };
  });
}
