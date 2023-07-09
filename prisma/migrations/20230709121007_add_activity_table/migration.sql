-- CreateEnum
CREATE TYPE "Model" AS ENUM ('Todo', 'User');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "Activity" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorId" BIGINT NOT NULL,
    "model" "Model" NOT NULL,
    "action" "Action" NOT NULL,
    "beforePayload" JSONB DEFAULT '{}',
    "afterPayload" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_uuid_key" ON "Activity"("uuid");

-- CreateIndex
CREATE INDEX "Activity_actorId_idx" ON "Activity"("actorId");
