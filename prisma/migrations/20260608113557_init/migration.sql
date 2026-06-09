-- CreateEnum
CREATE TYPE "Workspace" AS ENUM ('dev', 'study');

-- CreateEnum
CREATE TYPE "TaskWorkspace" AS ENUM ('dev', 'study', 'other');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'done', 'review');

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "workspace" "Workspace" NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "folder_id" TEXT,
    "workspace" "Workspace" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "status" "DocumentStatus" NOT NULL DEFAULT 'draft',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "workspace" "TaskWorkspace" NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "due_date" TIMESTAMP(3),
    "workspace" "TaskWorkspace" NOT NULL,
    "event_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "document_id" TEXT,
    "workspace" "Workspace" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
