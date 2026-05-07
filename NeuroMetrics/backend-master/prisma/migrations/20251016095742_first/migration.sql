-- CreateEnum
CREATE TYPE "public"."QUESTION_TYPE" AS ENUM ('scmcq', 'mcmcq', 'numerical', 'text', 'match', 'file_upload');

-- CreateEnum
CREATE TYPE "public"."MEDIA_FILE" AS ENUM ('image', 'video', 'audio', 'interactive');

-- CreateEnum
CREATE TYPE "public"."USER_TYPE" AS ENUM ('participant', 'tester', 'admin');

-- CreateEnum
CREATE TYPE "public"."ATTEMPT_STATUS" AS ENUM ('in_progress', 'submitted', 'graded');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "type" "public"."USER_TYPE" NOT NULL DEFAULT 'participant',
    "user_specific_info" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Test" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "duration" INTEGER,
    "allowNegativeMarking" BOOLEAN NOT NULL DEFAULT false,
    "allowPartialMarking" BOOLEAN NOT NULL DEFAULT false,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "test_specific_info" JSONB,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Section" (
    "id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "type" "public"."QUESTION_TYPE" NOT NULL,
    "ans" TEXT,
    "maxScore" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "negativeScore" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "partialMarking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Option" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "text" TEXT,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Media" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "label" TEXT,
    "type" "public"."MEDIA_FILE" NOT NULL,
    "url" TEXT,
    "version" TEXT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionMedia" (
    "questionId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,

    CONSTRAINT "QuestionMedia_pkey" PRIMARY KEY ("questionId","mediaId")
);

-- CreateTable
CREATE TABLE "public"."OptionMedia" (
    "optionId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,

    CONSTRAINT "OptionMedia_pkey" PRIMARY KEY ("optionId","mediaId")
);

-- CreateTable
CREATE TABLE "public"."ResponseMedia" (
    "responseId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,

    CONSTRAINT "ResponseMedia_pkey" PRIMARY KEY ("responseId","mediaId")
);

-- CreateTable
CREATE TABLE "public"."Attempt" (
    "id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "totalScore" DECIMAL(65,30),
    "status" "public"."ATTEMPT_STATUS" NOT NULL DEFAULT 'in_progress',

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Response" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "selectedOptionIds" INTEGER[],
    "answerText" TEXT,
    "score" DECIMAL(65,30),
    "evaluated" BOOLEAN DEFAULT false,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Test_createdBy_idx" ON "public"."Test"("createdBy");

-- CreateIndex
CREATE INDEX "Test_isActive_idx" ON "public"."Test"("isActive");

-- CreateIndex
CREATE INDEX "Test_createdAt_idx" ON "public"."Test"("createdAt");

-- CreateIndex
CREATE INDEX "Attempt_testId_userId_idx" ON "public"."Attempt"("testId", "userId");

-- CreateIndex
CREATE INDEX "Attempt_status_idx" ON "public"."Attempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Response_attemptId_questionId_key" ON "public"."Response"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "public"."Test" ADD CONSTRAINT "Test_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Section" ADD CONSTRAINT "Section_testId_fkey" FOREIGN KEY ("testId") REFERENCES "public"."Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Option" ADD CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionMedia" ADD CONSTRAINT "QuestionMedia_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionMedia" ADD CONSTRAINT "QuestionMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OptionMedia" ADD CONSTRAINT "OptionMedia_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OptionMedia" ADD CONSTRAINT "OptionMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResponseMedia" ADD CONSTRAINT "ResponseMedia_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "public"."Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResponseMedia" ADD CONSTRAINT "ResponseMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attempt" ADD CONSTRAINT "Attempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "public"."Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Response" ADD CONSTRAINT "Response_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Response" ADD CONSTRAINT "Response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
