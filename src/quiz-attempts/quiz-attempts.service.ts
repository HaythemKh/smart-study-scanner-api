/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

export interface DetailedAnswer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface QuizAttemptResult {
  attemptId: string;
  quizId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: DetailedAnswer[];
  completedAt: string;
}

@Injectable()
export class QuizAttemptsService {
  private readonly logger = new Logger(QuizAttemptsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit or update quiz attempt (ONE per quiz - one-to-one relation)
   */
  async submitAttempt(
    userId: string,
    dto: SubmitQuizDto,
  ): Promise<QuizAttemptResult> {
    this.logger.log(`📝 Submitting quiz attempt`);
    this.logger.log(`👤 User: ${userId}`);
    this.logger.log(`📋 Quiz: ${dto.quizId}`);
    this.logger.log(`✍️  Answers: ${dto.answers.length}`);

    // Verify quiz exists and get questions
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: dto.quizId },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`❌ Quiz not found: ${dto.quizId}`);
    }

    this.logger.log(`✅ Quiz found: "${quiz.title}"`);
    this.logger.log(`📊 Total questions: ${quiz.questions.length}`);

    // Calculate score and build detailed answers
    let correctCount = 0;
    const detailedAnswers: DetailedAnswer[] = [];

    for (const question of quiz.questions) {
      const userAnswer = dto.answers.find((a) => a.questionId === question.id);
      const selectedAnswer = userAnswer?.selectedAnswer || '';
      const correctAnswer = question.correctAnswer;
      const isCorrect = selectedAnswer === correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      detailedAnswers.push({
        questionId: question.id,
        userAnswer: selectedAnswer,
        correctAnswer: correctAnswer,
        isCorrect,
      });

      this.logger.log(
        `Q${question.questionNumber}: ${selectedAnswer} ${isCorrect ? '✅' : '❌'} (correct: ${correctAnswer})`,
      );
    }

    const totalQuestions = quiz.questions.length;
    const score =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    this.logger.log(
      `🎯 Score: ${score.toFixed(1)}% (${correctCount}/${totalQuestions})`,
    );

    // Upsert attempt (create or overwrite - ONE per quiz)
    const attempt = await this.prisma.quizAttempt.upsert({
      where: {
        quizId: dto.quizId,
      },
      update: {
        score: score,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        answers: detailedAnswers as any, // Cast to any for Prisma Json type
        completedAt: new Date(),
      },
      create: {
        quizId: dto.quizId,
        userId: userId,
        score: score,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        answers: detailedAnswers as any, // Cast to any for Prisma Json type
      },
    });

    this.logger.log(`💾 Attempt saved: ${attempt.id}`);

    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      answers: detailedAnswers,
      completedAt: attempt.completedAt.toISOString(),
    };
  }

  /**
   * Get quiz attempt (returns null if not attempted yet)
   */
  async getAttempt(_userId: string, quizId: string) {
    this.logger.log(`📜 Getting attempt for quiz: ${quizId}`);

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: {
        quizId: quizId,
      },
    });

    if (!attempt) {
      this.logger.log('ℹ️  No attempt found');
      return null;
    }

    this.logger.log(`✅ Found attempt: ${attempt.score.toFixed(1)}%`);

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      completedAt: attempt.completedAt.toISOString(),
    };
  }

  /**
   * Get all attempts for a user across all their quizzes
   */
  async getUserAttempts(userId: string) {
    this.logger.log(`📚 Getting all attempts for user: ${userId}`);

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Fetch quiz details for each attempt
    const attemptsWithQuiz = await Promise.all(
      attempts.map(async (attempt) => {
        const quiz = await this.prisma.quiz.findUnique({
          where: { id: attempt.quizId },
          select: {
            id: true,
            title: true,
          },
        });

        return {
          id: attempt.id,
          quizId: attempt.quizId,
          score: attempt.score,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          completedAt: attempt.completedAt.toISOString(),
          quiz: quiz || { id: attempt.quizId, title: 'Unknown Quiz' },
        };
      }),
    );

    this.logger.log(`✅ Found ${attemptsWithQuiz.length} total attempts`);

    return attemptsWithQuiz;
  }
}
