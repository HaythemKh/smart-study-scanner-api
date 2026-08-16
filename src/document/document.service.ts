/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create document record in database
   */
  async createDocument(data: {
    filename: string;
    mimeType: string;
    fileSize: number;
    title?: string;
    language?: string;
    wordCount?: number;
  }) {
    console.log('📄 [Document] Creating document record...');

    const document = await this.prisma.document.create({
      data: {
        filename: data.filename,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        title: data.title,
        language: data.language,
        wordCount: data.wordCount,
      },
    });

    console.log('✅ [Document] Document created:', document.id);
    this.logger.log(`Document created: ${document.id}`);

    return document;
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
    });
  }

  /**
   * Get all documents
   */
  async getAllDocuments() {
    return this.prisma.document.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
