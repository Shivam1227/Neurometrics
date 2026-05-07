-- AlterTable
ALTER TABLE "public"."Option" ADD COLUMN     "config" JSONB;

-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "config" JSONB;

-- AlterTable
ALTER TABLE "public"."Section" ADD COLUMN     "config" JSONB;
