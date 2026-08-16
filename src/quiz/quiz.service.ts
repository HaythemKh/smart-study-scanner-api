/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import type { QuizResult } from '../ai-generation/ai-generation.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create quiz with questions in database
   */
  async createQuiz(data: {
    libraryId: string;
    documentId: string;
    quizData: QuizResult;
  }) {
    console.log('💾 [Quiz] Creating quiz...');

    const quiz = await this.prisma.quiz.create({
      data: {
        title: data.quizData.title,
        description: `Quiz with ${data.quizData.questions.length} questions`,
        documentId: data.documentId,
        libraryId: data.libraryId,
        questions: {
          create: data.quizData.questions.map((q) => ({
            questionNumber: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    console.log('✅ [Quiz] Quiz created:', quiz.id);
    console.log('✅ [Quiz] Questions created:', quiz.questions.length);
    this.logger.log(`Quiz created: ${quiz.id}`);

    return quiz;
  }

  /**
   * Get all quizzes for a library
   */
  async getQuizzesByLibrary(libraryId: string) {
    return await this.prisma.quiz.findMany({
      where: { libraryId },
      include: {
        document: true,
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  /**
   * Get quiz by ID with questions
   */
  async getQuizById(id: string) {
    return await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        document: true,
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
    });
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
    });

    return this.prisma.quiz.update({
      where: { id },
      data: { isFavorite: !quiz?.isFavorite },
    });
  }

  /**
   * Delete quiz (cascade deletes questions)
   */
  async deleteQuiz(id: string) {
    return await this.prisma.quiz.delete({
      where: { id },
    });
  }

  /**
   * Update last accessed time
   */
  async updateAccessTime(id: string) {
    return await this.prisma.quiz.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    });
  }
}
