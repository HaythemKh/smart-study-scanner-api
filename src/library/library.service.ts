import { Injectable, NotFoundException } from '@nestjs/common';
import { GamificationService } from 'src/gamification/gamification.service';
import {
  AiGenerationService,
  type FlashcardsResult,
  type QuizResult,
  type SummaryResult,
} from '../ai-generation/ai-generation.service';
import { DocumentService } from '../document/document.service';
import { FlashcardService } from '../flashcard/flashcard.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuizService } from '../quiz/quiz.service';
import { SummaryService } from '../summary/summary.service';

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGenerationService: AiGenerationService,
    private readonly documentService: DocumentService,
    private readonly summaryService: SummaryService,
    private readonly quizService: QuizService,
    private readonly flashcardService: FlashcardService,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * Get or create user's library
   */
  async getOrCreateLibrary(userId: string) {
    console.log('📚 [Library] Getting/creating library for user:', userId);

    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { library: true },
    });

    if (!student) {
      console.error('❌ [Library] Student not found for userId:', userId);
      throw new NotFoundException('Student not found');
    }

    console.log('✅ [Library] Student found:', student.id);

    if (student.library) {
      console.log('✅ [Library] Existing library found:', student.library.id);
      return student.library.id;
    }

    console.log('📝 [Library] Creating new library for student...');
    const library = await this.prisma.library.create({
      data: { studentId: student.id },
    });

    console.log('✅ [Library] Library created:', library.id);
    return library.id;
  }

  /**
   * Save summary using specialized services
   */
  async saveSummary(
    userId: string,
    filename: string,
    mimeType: string,
    fileSize: number,
    summaryData: SummaryResult,
  ) {
    const libraryId = await this.getOrCreateLibrary(userId);

    const document = await this.documentService.createDocument({
      filename,
      mimeType,
      fileSize,
      title: summaryData.title,
      wordCount: summaryData.wordCount,
    });

    return this.summaryService.createSummary({
      libraryId,
      documentId: document.id,
      summaryData,
    });
  }

  /**
   * Save quiz using specialized services
   */
  async saveQuiz(
    userId: string,
    filename: string,
    mimeType: string,
    fileSize: number,
    quizData: QuizResult,
  ) {
    const libraryId = await this.getOrCreateLibrary(userId);

    const document = await this.documentService.createDocument({
      filename,
      mimeType,
      fileSize,
      title: quizData.title,
    });

    return this.quizService.createQuiz({
      libraryId,
      documentId: document.id,
      quizData,
    });
  }

  /**
   * Save flashcard set using specialized services
   */
  async saveFlashcardSet(
    userId: string,
    filename: string,
    mimeType: string,
    fileSize: number,
    flashcardData: FlashcardsResult,
  ) {
    const libraryId = await this.getOrCreateLibrary(userId);

    const document = await this.documentService.createDocument({
      filename,
      mimeType,
      fileSize,
      title: flashcardData.title,
    });

    return this.flashcardService.createFlashcardSet({
      libraryId,
      documentId: document.id,
      flashcardData,
    });
  }

  /**
   * Get all library content for a user
   */
  async getLibraryContent(userId: string) {
    const libraryId: string = await this.getOrCreateLibrary(userId);

    const [summaries, quizzes, flashcardSets] = await Promise.all([
      this.summaryService.getSummariesByLibrary(libraryId),
      this.quizService.getQuizzesByLibrary(libraryId),
      this.flashcardService.getFlashcardSetsByLibrary(libraryId),
    ]);

    return {
      summaries,
      quizzes,
      flashcardSets,
    };
  }

  /**
   * Get library statistics
   */
  async getLibraryStats(userId: string) {
    const content = await this.getLibraryContent(userId);

    return {
      totalSummaries: content.summaries.length,
      totalQuizzes: content.quizzes.length,
      totalFlashcardSets: content.flashcardSets.length,
      totalItems:
        content.summaries.length +
        content.quizzes.length +
        content.flashcardSets.length,
      favorites: {
        summaries: content.summaries.filter((s) => s.isFavorite).length,
        quizzes: content.quizzes.filter((q) => q.isFavorite).length,
        flashcardSets: content.flashcardSets.filter((f) => f.isFavorite).length,
      },
    };
  }

  /**
   * Get gamification stats
   */
  async getGamificationStats(userId: string) {
    return this.gamificationService.getStudentStats(userId);
  }

  /**
   * Generate content and save to database
   * This method handles the entire generation workflow:
   * 1. Generate content via AI
   * 2. Save to database
   * 3. Return result
   */
  async generateContent(params: {
    userId: string;
    buffer: Buffer;
    mimeType: string;
    filename: string;
    fileSize: number;
    type: 'summary' | 'quiz' | 'flashcards';
  }) {
    const { userId, buffer, mimeType, filename, fileSize, type } = params;

    console.log('🚀 [Library Service] Starting generation workflow...');
    console.log('📋 [Library Service] Type:', type);
    console.log('📄 [Library Service] File:', filename);

    // Step 1: Generate content via AI
    console.log('🤖 [Library Service] Calling AI generation...');
    const result = await this.aiGenerationService.generate({
      buffer,
      mimeType,
      filename,
      type,
    });

    console.log('✅ [Library Service] Generation successful!');
    console.log('💾 [Library Service] Saving to database...');

    // Step 2: Save to database based on type
    let savedData: { id: string; generatedAt?: Date; createdAt?: Date };

    switch (type) {
      case 'summary':
        savedData = await this.saveSummary(
          userId,
          filename,
          mimeType,
          fileSize,
          result as SummaryResult,
        );
        break;

      case 'quiz':
        savedData = await this.saveQuiz(
          userId,
          filename,
          mimeType,
          fileSize,
          result as QuizResult,
        );
        break;

      case 'flashcards':
        savedData = await this.saveFlashcardSet(
          userId,
          filename,
          mimeType,
          fileSize,
          result as FlashcardsResult,
        );
        break;

      default:
        throw new Error('Invalid generation type');
    }

    console.log('✅ [Library Service] Saved with ID:', savedData.id);

    // Step 3: Award XP for generation
    console.log('🎮 [Library Service] Awarding XP...');
    const xpReward = await this.gamificationService.awardXP(
      userId,
      `generate_${type}`,
    );

    console.log(`✨ [Library Service] XP Awarded: +${xpReward.xpGained}`);
    if (xpReward.leveledUp) {
      console.log(
        `🎉 [Library Service] LEVEL UP! ${xpReward.previousLevel} → ${xpReward.currentLevel}`,
      );
    }

    // Step 4: Update streak
    const streak = await this.gamificationService.updateStreak(userId);
    console.log(`🔥 [Library Service] Streak: ${streak}`);

    // Step 5: Return formatted result
    return {
      success: true,
      type,
      filename,
      data: result,
      saved: {
        id: savedData.id,
        createdAt: savedData.generatedAt || savedData.createdAt,
      },
      reward: {
        xpGained: xpReward.xpGained,
        totalXP: xpReward.totalXP,
        level: xpReward.currentLevel,
        leveledUp: xpReward.leveledUp,
        xpToNextLevel: xpReward.xpToNextLevel,
        streak,
      },
    };
  }
}
