/*
  Warnings:

  - You are about to drop the column `config` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `config` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `config` on the `Section` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Option" DROP COLUMN "config";

-- AlterTable
ALTER TABLE "public"."Question" DROP COLUMN "config";

-- AlterTable
ALTER TABLE "public"."Section" DROP COLUMN "config";
