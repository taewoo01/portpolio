import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);

  // 인증 불필요 경로
  if (pathname === "/login" || pathname === "/timer/float") return res;

  const session = await getIronSession<SessionData>(request, res, sessionOptions);
  if (!session.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
