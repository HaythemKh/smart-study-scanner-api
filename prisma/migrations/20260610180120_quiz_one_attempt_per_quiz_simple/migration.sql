/*
  Warnings:

  - A unique constraint covering the columns `[quizId]` on the table `quiz_attempts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "quiz_attempts_quizId_idx";

-- DropIndex
DROP INDEX "quiz_attempts_quizId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_quizId_key" ON "quiz_attempts"("quizId");

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
