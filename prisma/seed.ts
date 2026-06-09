import { prisma } from "../src/lib/db";
import type { Workspace } from "../src/generated/prisma/client";

async function seedWorkspace(workspace: Workspace) {
  const existing = await prisma.folder.count({ where: { workspace } });
  if (existing > 0) return;

  const isDev = workspace === "dev";

  const mainFolder = await prisma.folder.create({
    data: { workspace, name: isDev ? "프로젝트" : "진행 중" },
  });
  await prisma.folder.create({
    data: { workspace, name: isDev ? "기술 스택" : "CS 기초" },
  });

  await prisma.document.create({
    data: {
      workspace,
      folderId: mainFolder.id,
      title: isDev ? "portpolio 프로젝트 메모" : "이번 주 학습 계획",
      content: isDev
        ? "# portpolio\n\nNotion 스타일 개인 지식 허브 프로젝트를 정리하는 문서입니다."
        : "# 학습 계획\n\n이번 주에 공부할 내용을 정리합니다.",
      status: "draft",
      tags: isDev ? ["nextjs", "prisma"] : ["계획"],
    },
  });
}

async function main() {
  await seedWorkspace("dev");
  await seedWorkspace("study");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
