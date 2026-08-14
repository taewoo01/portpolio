-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "subject_id" TEXT;

-- CreateTable
CREATE TABLE "study_subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3182F6',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_subjects_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
