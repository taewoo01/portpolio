-- CreateTable
CREATE TABLE "workspace_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3182F6',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_categories_pkey" PRIMARY KEY ("id")
);

-- Seed initial categories with fixed IDs for data migration
INSERT INTO "workspace_categories" ("id", "name", "color", "sort_order") VALUES
    ('cat-dev', '개발', '#3182F6', 0),
    ('cat-study', '공부', '#a855f7', 1);

-- AlterTable folders: add FK column, migrate data, enforce NOT NULL
ALTER TABLE "folders" ADD COLUMN "workspace_category_id" TEXT;
UPDATE "folders" SET "workspace_category_id" = CASE WHEN "workspace"::text = 'dev' THEN 'cat-dev' ELSE 'cat-study' END;
ALTER TABLE "folders" ALTER COLUMN "workspace_category_id" SET NOT NULL;
ALTER TABLE "folders" ADD CONSTRAINT "folders_workspace_category_id_fkey"
    FOREIGN KEY ("workspace_category_id") REFERENCES "workspace_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "folders" DROP COLUMN "workspace";

-- AlterTable documents: add FK column, migrate data, enforce NOT NULL
ALTER TABLE "documents" ADD COLUMN "workspace_category_id" TEXT;
UPDATE "documents" SET "workspace_category_id" = CASE WHEN "workspace"::text = 'dev' THEN 'cat-dev' ELSE 'cat-study' END;
ALTER TABLE "documents" ALTER COLUMN "workspace_category_id" SET NOT NULL;
ALTER TABLE "documents" ADD CONSTRAINT "documents_workspace_category_id_fkey"
    FOREIGN KEY ("workspace_category_id") REFERENCES "workspace_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents" DROP COLUMN "workspace";

-- AlterTable blog_posts: add FK column, migrate data, enforce NOT NULL
ALTER TABLE "blog_posts" ADD COLUMN "workspace_category_id" TEXT;
UPDATE "blog_posts" SET "workspace_category_id" = CASE WHEN "workspace"::text = 'dev' THEN 'cat-dev' ELSE 'cat-study' END;
ALTER TABLE "blog_posts" ALTER COLUMN "workspace_category_id" SET NOT NULL;
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_workspace_category_id_fkey"
    FOREIGN KEY ("workspace_category_id") REFERENCES "workspace_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blog_posts" DROP COLUMN "workspace";

-- DropEnum
DROP TYPE IF EXISTS "Workspace";
