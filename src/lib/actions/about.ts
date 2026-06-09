"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import type { SiteLink } from "@/config/site";

export async function saveAboutProfileAction(data: {
  name: string;
  role: string;
  bio: string[];
  skills: string[];
  links: SiteLink[];
}) {
  const owner = await getUser();
  if (!owner) return;

  await prisma.aboutProfile.upsert({
    where: { owner },
    create: { owner, ...data, links: data.links },
    update: { ...data, links: data.links },
  });

  revalidatePath("/about");
}
