import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/server/auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const currentUser = await getUser();
  if (!currentUser) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "허용되지 않는 파일 형식입니다." }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "파일 크기는 5MB를 초과할 수 없습니다." }, { status: 400 });
  }

  const blob = await put(`uploads/${randomUUID()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });
  return NextResponse.json({ url: blob.url });
}
