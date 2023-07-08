-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('P4', 'P3', 'P2', 'P1', 'P0');

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'P2',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
