"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";

export async function createStudySubjectAction(
  name: string,
  color: string
): Promise<{ id: string } | { error: string }> {
  if (!name.trim()) return { error: "이름을 입력해주세요." };
  if (!(await getUser())) return { error: "로그인이 필요합니다." };
  try {
    const count = await prisma.studySubject.count();
    const subject = await prisma.studySubject.create({
      data: { name: name.trim(), color, sortOrder: count },
    });
    revalidatePath("/timer");
    return { id: subject.id };
  } catch (e) {
    console.error(e);
    return { error: "과목 생성에 실패했습니다." };
  }
}

export async function updateStudySubjectAction(
  id: string,
  name: string,
  color: string
): Promise<{ error: string } | undefined> {
  if (!name.trim()) return { error: "이름을 입력해주세요." };
  if (!(await getUser())) return { error: "로그인이 필요합니다." };
  try {
    await prisma.studySubject.update({
      where: { id },
      data: { name: name.trim(), color },
    });
    revalidatePath("/timer");
  } catch (e) {
    console.error(e);
    return { error: "과목 수정에 실패했습니다." };
  }
}

export async function deleteStudySubjectAction(
  id: string
): Promise<{ error: string } | undefined> {
  if (!(await getUser())) return { error: "로그인이 필요합니다." };
  try {
    // 세션 자체는 유지하고 과목 연결만 해제한다 (onDelete: SetNull)
    await prisma.studySubject.delete({ where: { id } });
    revalidatePath("/timer");
  } catch (e) {
    console.error(e);
    return { error: "과목 삭제에 실패했습니다." };
  }
}
