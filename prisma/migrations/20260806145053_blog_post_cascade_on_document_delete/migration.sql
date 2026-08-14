-- DropForeignKey
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_document_id_fkey";

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
