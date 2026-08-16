/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import type { SummaryResult } from '../ai-generation/ai-generation.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create summary in database
   */
  async createSummary(data: {
    libraryId: string;
    documentId: string;
    summaryData: SummaryResult;
  }) {
    console.log('💾 [Summary] Creating summary...');

    const summary = await this.prisma.summary.create({
      data: {
        title: data.summaryData.title,
        summary: data.summaryData.summary,
        keyPoints: data.summaryData.keyPoints,
        wordCount: data.summaryData.wordCount,
        documentId: data.documentId,
        libraryId: data.libraryId,
      },
    });

    console.log('✅ [Summary] Summary created:', summary.id);
    this.logger.log(`Summary created: ${summary.id}`);

    return summary;
  }

  /**
   * Get all summaries for a library
   */
  async getSummariesByLibrary(libraryId: string) {
    return await this.prisma.summary.findMany({
      where: { libraryId },
      include: {
        document: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  /**
   * Get summary by ID
   */
  async getSummaryById(id: string) {
    return await this.prisma.summary.findUnique({
      where: { id },
      include: {
        document: true,
      },
    });
  }

  /**
   * Update summary favorite status
   */
  async toggleFavorite(id: string) {
    const summary = await this.prisma.summary.findUnique({
      where: { id },
    });

    return this.prisma.summary.update({
      where: { id },
      data: { isFavorite: !summary?.isFavorite },
    });
  }

  /**
   * Delete summary
   */
  async deleteSummary(id: string) {
    return await this.prisma.summary.delete({
      where: { id },
    });
  }

  /**
   * Update last accessed time
   */
  async updateAccessTime(id: string) {
    return await this.prisma.summary.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    });
  }
}
