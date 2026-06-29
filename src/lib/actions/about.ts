"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import type { SiteLink } from "@/config/site";

const EMAIL_PATTERN = /^[^\s@:/]+@[^\s@]+\.[^\s@]+$/;

function normalizeLinks(links: SiteLink[]): SiteLink[] {
  return links.map((link) =>
    EMAIL_PATTERN.test(link.href) ? { ...link, href: `mailto:${link.href}` } : link
  );
}

export async function saveAboutProfileAction(data: {
  name: string;
  role: string;
  bio: string[];
  skills: string[];
  links: SiteLink[];
}) {
  const owner = await getUser();
  if (!owner) return;

  const links = normalizeLinks(data.links);

  await prisma.aboutProfile.upsert({
    where: { owner },
    create: { owner, ...data, links },
    update: { ...data, links },
  });

  revalidatePath("/about");
}
