import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";

export async function GET() {
  const currentUser = await getUser();
  if (!currentUser) return NextResponse.json({ url: null, enabled: true });

  const profile = await prisma.aboutProfile.findUnique({
    where: { owner: currentUser },
    select: { timerCharacterUrl: true, timerCharacterEnabled: true },
  });
  return NextResponse.json({
    url: profile?.timerCharacterUrl ?? null,
    enabled: profile?.timerCharacterEnabled ?? true,
  });
}
