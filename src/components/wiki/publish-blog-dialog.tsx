"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteBlogPostAction, publishDocumentAction, unpublishPostAction } from "@/lib/actions/blog";
import { slugify } from "@/lib/slug";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { BlogPostModel } from "@/generated/prisma/models";

export function PublishBlogDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  post,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  post: BlogPostModel | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [title, setTitle] = useState(post?.title ?? documentTitle);
  const [slug, setSlug] = useState(post?.slug ?? slugify(documentTitle));
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [isPublishing, startPublish] = useTransition();
  const [isUnpublishing, startUnpublish] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (!open) return;
    setTitle(post?.title ?? documentTitle);
    setSlug(post?.slug ?? slugify(documentTitle));
    setSlugTouched(Boolean(post));
  }, [open, post, documentTitle]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  const publishAction = publishDocumentAction.bind(null, documentId);

  function handleSubmit(formData: FormData) {
    startPublish(async () => {
      const result = await publishAction(formData);
      if (result?.error) { console.error(result.error); return; }
      router.refresh();
      onOpenChange(false);
    });
  }

  function handleUnpublish() {
    if (!post) return;
    startUnpublish(async () => {
      const result = await unpublishPostAction(post.id);
      if (result?.error) { console.error(result.error); return; }
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!post) return;
    const ok = await confirm({
      title: "블로그 글 삭제",
      description: "블로그 글을 삭제할까요? 원본 문서는 유지됩니다.",
      confirmText: "삭제",
      variant: "destructive",
    });
    if (!ok) return;
    startDelete(async () => {
      const result = await deleteBlogPostAction(post.id);
      if (result?.error) { console.error(result.error); return; }
      router.refresh();
      onOpenChange(false);
    });
  }

  const isPublished = Boolean(post?.published);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{post ? "블로그 글 관리" : "블로그로 발행"}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="blog-title">제목</Label>
            <Input
              id="blog-title"
              name="title"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="blog-slug">slug</Label>
            <Input
              id="blog-slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugTouched(true);
              }}
              required
            />
            <p className="text-xs text-muted-foreground">/blog/{slug || "..."}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="blog-excerpt">요약 (선택)</Label>
            <Textarea
              id="blog-excerpt"
              name="excerpt"
              defaultValue={post?.excerpt ?? ""}
              placeholder="목록에 보여줄 짧은 소개"
              className="min-h-20"
            />
          </div>

          {isPublished && post && (
            <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm text-primary hover:underline">
              블로그에서 보기 →
            </Link>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {post && (
              <>
                <Button type="button" variant="ghost" onClick={handleDelete} disabled={isDeleting}>
                  글 삭제
                </Button>
                {isPublished && (
                  <Button type="button" variant="outline" onClick={handleUnpublish} disabled={isUnpublishing}>
                    발행 취소
                  </Button>
                )}
              </>
            )}
            <Button type="submit" disabled={isPublishing}>
              {post ? "다시 발행" : "발행"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
