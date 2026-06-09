-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);
