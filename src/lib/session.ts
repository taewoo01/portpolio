import type { SessionOptions } from "iron-session";
import type { User } from "@/lib/auth";

export type SessionData = {
  user?: User;
};

const password = process.env.SESSION_SECRET;
if (!password) throw new Error("SESSION_SECRET is not set");

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30일
  },
};
