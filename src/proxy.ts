import { NextRequest, NextResponse } from "next/server";

const VALID_USERS = ["taewoo", "yujin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") return NextResponse.next();

  const user = request.cookies.get("user")?.value;
  if (!user || !VALID_USERS.includes(user)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
