/*
  Warnings:

  - The values [match] on the enum `QUESTION_TYPE` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."QUESTION_TYPE_new" AS ENUM ('scmcq', 'mcmcq', 'numerical', 'text', 'file_upload');
ALTER TABLE "public"."Question" ALTER COLUMN "type" TYPE "public"."QUESTION_TYPE_new" USING ("type"::text::"public"."QUESTION_TYPE_new");
ALTER TYPE "public"."QUESTION_TYPE" RENAME TO "QUESTION_TYPE_old";
ALTER TYPE "public"."QUESTION_TYPE_new" RENAME TO "QUESTION_TYPE";
DROP TYPE "public"."QUESTION_TYPE_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Option" ADD COLUMN     "config" JSONB;

-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "config" JSONB;

-- AlterTable
ALTER TABLE "public"."Section" ADD COLUMN     "config" JSONB;
