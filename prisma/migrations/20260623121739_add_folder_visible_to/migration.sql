-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "visible_to" TEXT[] DEFAULT ARRAY[]::TEXT[];
