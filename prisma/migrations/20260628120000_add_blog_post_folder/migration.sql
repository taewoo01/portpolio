-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN "folder_id" TEXT;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
