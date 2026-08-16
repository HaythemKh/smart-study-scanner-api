/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import type { FlashcardsResult } from '../ai-generation/ai-generation.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FlashcardService {
  private readonly logger = new Logger(FlashcardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create flashcard set with cards in database
   */
  async createFlashcardSet(data: {
    libraryId: string;
    documentId: string;
    flashcardData: FlashcardsResult;
  }) {
    console.log('💾 [Flashcard] Creating flashcard set...');

    const flashcardSet = await this.prisma.flashcardSet.create({
      data: {
        title: data.flashcardData.title,
        description: `Flashcard set with ${data.flashcardData.flashcards.length} cards`,
        documentId: data.documentId,
        libraryId: data.libraryId,
        flashcards: {
          create: data.flashcardData.flashcards.map((card) => ({
            cardNumber: card.id,
            front: card.front,
            back: card.back,
            hint: card.hint || null,
          })),
        },
      },
      include: {
        flashcards: true,
      },
    });

    console.log('✅ [Flashcard] Flashcard set created:', flashcardSet.id);
    console.log(
      '✅ [Flashcard] Cards created:',
      flashcardSet.flashcards.length,
    );
    this.logger.log(`Flashcard set created: ${flashcardSet.id}`);

    return flashcardSet;
  }

  /**
   * Get all flashcard sets for a library
   */
  async getFlashcardSetsByLibrary(libraryId: string) {
    return await this.prisma.flashcardSet.findMany({
      where: { libraryId },
      include: {
        document: true,
        flashcards: {
          orderBy: { cardNumber: 'asc' },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  /**
   * Get flashcard set by ID with cards
   */
  async getFlashcardSetById(id: string) {
    return await this.prisma.flashcardSet.findUnique({
      where: { id },
      include: {
        document: true,
        flashcards: {
          orderBy: { cardNumber: 'asc' },
        },
      },
    });
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string) {
    const set = await this.prisma.flashcardSet.findUnique({
      where: { id },
    });

    return await this.prisma.flashcardSet.update({
      where: { id },
      data: { isFavorite: !set?.isFavorite },
    });
  }

  /**
   * Delete flashcard set (cascade deletes cards)
   */
  async deleteFlashcardSet(id: string) {
    return await this.prisma.flashcardSet.delete({
      where: { id },
    });
  }

  /**
   * Update last accessed time
   */
  async updateAccessTime(id: string) {
    return await this.prisma.flashcardSet.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    });
  }
}
