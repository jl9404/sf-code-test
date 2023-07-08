-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'READONLY_USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[];
