import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalDocuments,
      totalQuizzes,
      totalSummaries,
      totalFlashcards,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: {
            not: 'ADMIN', // Exclude admin users from total count
          },
        },
      }),
      this.prisma.document.count(),
      this.prisma.quiz.count(),
      this.prisma.summary.count(),
      this.prisma.flashcardSet.count(),
    ]);

    return {
      totalUsers,
      totalDocuments,
      totalQuizzes,
      totalSummaries,
      totalFlashcards,
    };
  }

  /**
   * Get all users with their statistics
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN', // Exclude users with admin role
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        student: {
          select: {
            level: true,
            xp: true,
            streak: true,
            library: {
              select: {
                _count: {
                  select: {
                    quizzes: true,
                    summaries: true,
                    flashcardSets: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.fullName || 'Unknown User',
      email: user.email,
      role: user.role,
      level: user.student?.level || 0,
      xp: user.student?.xp || 0,
      streak: user.student?.streak || 0,
      joinDate: user.createdAt.toISOString(),
      quizzesGenerated: user.student?.library?._count.quizzes || 0,
      summariesGenerated: user.student?.library?._count.summaries || 0,
      flashcardsGenerated: user.student?.library?._count.flashcardSets || 0,
      documentsUploaded: 0,
    }));
  }

  /**
   * Get user details by ID
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        student: {
          select: {
            level: true,
            xp: true,
            streak: true,
            library: {
              select: {
                _count: {
                  select: {
                    quizzes: true,
                    summaries: true,
                    flashcardSets: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      id: user.id,
      name: user.fullName || 'Unknown User',
      email: user.email,
      role: user.role,
      level: user.student?.level || 0,
      xp: user.student?.xp || 0,
      streak: user.student?.streak || 0,
      joinDate: user.createdAt.toISOString(),
      quizzesGenerated: user.student?.library?._count.quizzes || 0,
      summariesGenerated: user.student?.library?._count.summaries || 0,
      flashcardsGenerated: user.student?.library?._count.flashcardSets || 0,
      documentsUploaded: 0,
    };
  }

  /**
   * Delete user and all associated data
   */
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User and all associated data deleted successfully' };
  }

  /**
   * Get all documents with details
   */
  async getAllDocuments() {
    const documents = await this.prisma.document.findMany({
      include: {
        _count: {
          select: {
            quizzes: true,
            summaries: true,
            flashcardSets: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return documents.map((doc) => ({
      id: doc.id,
      name: doc.filename,
      uploadDate: doc.uploadedAt.toISOString(),
      uploadedBy: {
        id: 'system',
        name: 'System User',
        email: 'system@smartstudyscanner.com',
      },
      size: doc.fileSize || 0,
      usedFor: {
        quizzes: doc._count.quizzes,
        summaries: doc._count.summaries,
        flashcards: doc._count.flashcardSets,
      },
      content: doc.title || 'No content available',
    }));
  }

  /**
   * Get document details by ID
   */
  async getDocumentById(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        _count: {
          select: {
            quizzes: true,
            summaries: true,
            flashcardSets: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    return {
      id: document.id,
      name: document.filename,
      uploadDate: document.uploadedAt.toISOString(),
      uploadedBy: {
        id: 'system',
        name: 'System User',
        email: 'system@smartstudyscanner.com',
      },
      size: document.fileSize || 0,
      usedFor: {
        quizzes: document._count.quizzes,
        summaries: document._count.summaries,
        flashcards: document._count.flashcardSets,
      },
      content: document.title || 'No content available',
      fileUrl: document.fileUrl,
    };
  }

  /**
   * Delete document and all associated data
   */
  async deleteDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return {
      message: 'Document and all associated data deleted successfully',
    };
  }
}
