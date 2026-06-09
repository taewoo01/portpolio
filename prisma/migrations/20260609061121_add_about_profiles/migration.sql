-- CreateTable
CREATE TABLE "about_profiles" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT[],
    "skills" TEXT[],
    "links" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "about_profiles_owner_key" ON "about_profiles"("owner");
