/*
  Warnings:

  - The values [DONE] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `attachmentUrl` on the `Task` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');
ALTER TABLE "public"."Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'TODO';
COMMIT;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "attachmentUrl",
ADD COLUMN     "assigneeAttachment" TEXT,
ADD COLUMN     "creatorAttachment" TEXT,
ADD COLUMN     "resolutionNotes" TEXT;
