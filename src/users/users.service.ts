import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateUserProfileDto,
  UpdateUserStatsDto,
} from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user (for testing)
   */
  async createUser(data: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    role?: 'ADMIN' | 'STUDENT';
    authProvider?: 'EMAIL' | 'GOOGLE';
    googleId?: string;
    passwordHash?: string;
  }): Promise<UserEntity> {
    // Create user with Student profile and Library
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        role: data.role || 'STUDENT',
        authProvider: data.authProvider || 'GOOGLE',
        googleId: data.googleId,
        isVerified: true,
        isActive: true,
      },
    });

    // If student, create Student profile with Library
    if (user.role === 'STUDENT') {
      await this.prisma.student.create({
        data: {
          userId: user.id,
          library: {
            create: {}, // Auto-create library
          },
        },
      });
    }
    // If admin, create Admin profile
    else if (user.role === 'ADMIN' && data.passwordHash) {
      await this.prisma.admin.create({
        data: {
          userId: user.id,
          passwordHash: data.passwordHash,
        },
      });
    }

    return new UserEntity(user);
  }

  /**
   * Find user by ID with Student/Admin data
   */
  async findById(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        admin: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return new UserEntity(user);
  }

  /**
   * Find user by Google ID with Student data
   */
  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { googleId },
      include: {
        student: true,
      },
    });

    return user ? new UserEntity(user) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
      },
    });

    return user ? new UserEntity(user) : null;
  }

  /**
   * Get admin data with password hash (internal use only)
   */
  async getAdminData(userId: string): Promise<{ passwordHash: string } | null> {
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
      select: {
        passwordHash: true,
      },
    });

    return admin;
  }

  /**
   * Update user profile (name, avatar)
   */
  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
      },
    });

    return new UserEntity(user);
  }

  /**
   * Update user stats (XP, level, streak) - STUDENT only
   */
  async updateStats(
    userId: string,
    dto: UpdateUserStatsDto,
  ): Promise<UserEntity> {
    // Find student by userId
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException(`Student not found for user ${userId}`);
    }

    // Update student stats
    await this.prisma.student.update({
      where: { id: student.id },
      data: {
        xp: dto.xp ?? student.xp,
        level: dto.level ?? student.level,
        streak: dto.streak ?? student.streak,
        lastActiveAt: new Date(),
      },
    });

    // Return user with updated student data
    return this.findById(userId);
  }

  /**
   * Award XP to user and calculate new level
   */
  async awardXP(userId: string, xpAmount: number): Promise<UserEntity> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException(`Student not found for user ${userId}`);
    }

    const newXP = student.xp + xpAmount;
    const XP_PER_LEVEL = 1500;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

    await this.prisma.student.update({
      where: { id: student.id },
      data: {
        xp: newXP,
        level: newLevel,
        lastActiveAt: new Date(),
      },
    });

    return this.findById(userId);
  }

  /**
   * Update user streak (daily login tracking)
   */
  async updateStreak(userId: string): Promise<number> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException(`Student not found for user ${userId}`);
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const lastActive = student.lastActiveAt
      ? (() => {
          const date = new Date(student.lastActiveAt);
          date.setHours(0, 0, 0, 0);
          return date;
        })()
      : null;

    let newStreak = student.streak;

    // Check if user hasn't logged in today
    if (!lastActive || lastActive < today) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActive && lastActive.getTime() === yesterday.getTime()) {
        // Continue streak
        newStreak += 1;
      } else {
        // Reset streak
        newStreak = 1;
      }

      await this.prisma.student.update({
        where: { id: student.id },
        data: {
          streak: newStreak,
          lastActiveAt: new Date(),
        },
      });
    }

    return newStreak;
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException(`Student not found for user ${userId}`);
    }

    return {
      level: student.level,
      xp: student.xp,
      streak: student.streak,
      xpToNextLevel: 1500 - (student.xp % 1500),
      progress: ((student.xp % 1500) / 1500) * 100,
    };
  }

  /**
   * Get all users (for testing)
   */
  async getAllUsers(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => new UserEntity(user));
  }

  /**
   * Update user's Google ID
   */
  async updateGoogleId(userId: string, googleId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { googleId },
    });
  }
}
