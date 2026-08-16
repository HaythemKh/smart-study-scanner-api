/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { GenerationType } from '../ai-generation/ai-generation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FlashcardService } from '../flashcard/flashcard.service';
import { QuizService } from '../quiz/quiz.service';
import { SummaryService } from '../summary/summary.service';
import { LibraryService } from './library.service';

interface AuthRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly summaryService: SummaryService,
    private readonly quizService: QuizService,
    private readonly flashcardService: FlashcardService,
  ) {}

  // ==================== GENERATION ENDPOINT ====================

  @Post('generate')
  async generate(@Req() req: AuthRequest, @Query('type') type: GenerationType) {
    console.log('🎯 [Library Controller] Generate endpoint called');
    console.log('👤 [Library Controller] User:', req.user.email);
    console.log('📋 [Library Controller] Type:', type);

    // Validate type parameter
    const validTypes: GenerationType[] = ['summary', 'quiz', 'flashcards'];
    if (!type || !validTypes.includes(type)) {
      throw new BadRequestException(
        `Query param "type" must be one of: ${validTypes.join(', ')}`,
      );
    }

    // Validate multipart request
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data');
    }

    // Extract file from request
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    const buffer = await data.toBuffer();
    const mimeType = data.mimetype;
    const filename = data.filename;
    const fileSize = buffer.length;

    // Validate file size
    if (fileSize === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    try {
      // Delegate business logic to service
      return await this.libraryService.generateContent({
        userId: req.user.userId,
        buffer,
        mimeType,
        filename,
        fileSize,
        type,
      });
    } catch (err) {
      console.error('❌ [Library Controller] Error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Generation error';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  // ==================== LIBRARY CONTENT ENDPOINTS ====================

  @Get('content')
  async getLibraryContent(@Req() req: AuthRequest) {
    return this.libraryService.getLibraryContent(req.user.userId);
  }

  @Get('stats')
  async getLibraryStats(@Req() req: AuthRequest) {
    return this.libraryService.getLibraryStats(req.user.userId);
  }

  @Get('gamification/stats')
  async getGamificationStats(@Req() req: AuthRequest) {
    return this.libraryService.getGamificationStats(req.user.userId);
  }

  // ==================== SUMMARY ENDPOINTS ====================

  @Get('summaries')
  async getSummaries(@Req() req: AuthRequest) {
    const libraryId: string = await this.libraryService.getOrCreateLibrary(
      req.user.userId,
    );
    return this.summaryService.getSummariesByLibrary(libraryId);
  }

  @Get('summaries/:id')
  async getSummary(@Param('id') id: string) {
    return this.summaryService.getSummaryById(id);
  }

  @Patch('summaries/:id/favorite')
  async toggleSummaryFavorite(@Param('id') id: string) {
    return this.summaryService.toggleFavorite(id);
  }

  @Delete('summaries/:id')
  async deleteSummary(@Param('id') id: string) {
    return this.summaryService.deleteSummary(id);
  }

  // ==================== QUIZ ENDPOINTS ====================

  @Get('quizzes')
  async getQuizzes(@Req() req: AuthRequest) {
    const libraryId: string = await this.libraryService.getOrCreateLibrary(
      req.user.userId,
    );
    return this.quizService.getQuizzesByLibrary(libraryId);
  }

  @Get('quizzes/:id')
  async getQuiz(@Param('id') id: string) {
    return this.quizService.getQuizById(id);
  }

  @Patch('quizzes/:id/favorite')
  async toggleQuizFavorite(@Param('id') id: string) {
    return this.quizService.toggleFavorite(id);
  }

  @Delete('quizzes/:id')
  async deleteQuiz(@Param('id') id: string) {
    return this.quizService.deleteQuiz(id);
  }

  // ==================== FLASHCARD ENDPOINTS ====================

  @Get('flashcards')
  async getFlashcardSets(@Req() req: AuthRequest) {
    const libraryId: string = await this.libraryService.getOrCreateLibrary(
      req.user.userId,
    );
    return this.flashcardService.getFlashcardSetsByLibrary(libraryId);
  }

  @Get('flashcards/:id')
  async getFlashcardSet(@Param('id') id: string) {
    return this.flashcardService.getFlashcardSetById(id);
  }

  @Patch('flashcards/:id/favorite')
  async toggleFlashcardFavorite(@Param('id') id: string) {
    return this.flashcardService.toggleFavorite(id);
  }

  @Delete('flashcards/:id')
  async deleteFlashcardSet(@Param('id') id: string) {
    return this.flashcardService.deleteFlashcardSet(id);
  }
}
