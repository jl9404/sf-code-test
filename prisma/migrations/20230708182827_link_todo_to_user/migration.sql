/*
  Warnings:

  - Added the required column `authorId` to the `Todo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "authorId" BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX "Todo_authorId_idx" ON "Todo"("authorId");
