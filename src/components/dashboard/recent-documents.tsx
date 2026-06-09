"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/wiki/document-meta";
import type { DocumentModel } from "@/generated/prisma/models";
import type { Workspace } from "@/generated/prisma/client";

const TABS: { value: Workspace; label: string }[] = [
  { value: "dev", label: "개발" },
  { value: "study", label: "공부" },
];

export function RecentDocuments({ dev, study }: { dev: DocumentModel[]; study: DocumentModel[] }) {
  const [tab, setTab] = useState<Workspace>("dev");
  const documents = tab === "dev" ? dev : study;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">최근 문서</h2>
        <div className="flex gap-1">
          {TABS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={tab === item.value ? "secondary" : "ghost"}
              onClick={() => setTab(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 문서가 없습니다.</p>
      ) : (
        <ul className="divide-y">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/${tab}/${doc.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
              >
                <StatusBadge status={doc.status} />
                <span className="truncate font-medium">{doc.title}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {doc.updatedAt.toLocaleDateString("ko-KR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
