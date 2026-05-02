/*
  Warnings:

  - You are about to drop the column `name` on the `Task` table. All the data in the column will be lost.
  - Added the required column `title` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'URGENT';

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "name",
ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;
