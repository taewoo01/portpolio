-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "todos" ADD COLUMN     "created_by" TEXT;
