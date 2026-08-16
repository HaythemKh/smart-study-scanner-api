import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface XPReward {
  xpGained: number;
  totalXP: number;
  previousLevel: number;
  currentLevel: number;
  leveledUp: boolean;
  xpToNextLevel: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate XP to award based on student level
   * Rules:
   * - Levels 1-5: +750 XP per generation
   * - Level 6+: +300 XP per generation
   */
  calculateXPReward(currentLevel: number): number {
    if (currentLevel <= 5) {
      return 200;
    }
    return 100;
  }

  /**
   * Calculate XP required for a specific level
   * Each level requires EXACTLY 1500 XP (fixed cap)
   * Level 1: 0-1499 XP (then reset to 0 at level 2)
   * Level 2: 0-1499 XP (then reset to 0 at level 3)
   * etc.
   */
  calculateXPForLevel(level: number): number {
    return 1500; // Fixed 1500 XP per level
  }

  /**
   * Calculate current level based on total XP
   * Each level requires exactly 1500 XP
   */
  calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / 1500) + 1;
  }

  /**
   * Calculate XP within current level (0-1499)
   */
  calculateXPInCurrentLevel(totalXP: number): number {
    return totalXP % 1500;
  }

  /**
   * Award XP to a student and update their level
   * Returns detailed information about the reward
   */
  async awardXP(userId: string, action: string): Promise<XPReward> {
    const student = await this.prisma.student.findUnique({ where: { userId } });

    if (!student) throw new Error('Student not found');

    const previousLevel = student.level;
    const previousXP = student.xp; // current XP within level (0-1500)

    // Calculate reward based on current level
    const xpGained = this.calculateXPReward(previousLevel);

    // Add XP within current level
    const newXP = previousXP + xpGained;

    // Check if leveled up
    let newLevel = previousLevel;
    let xpInCurrentLevel = newXP;

    if (newXP >= 1500) {
      newLevel = previousLevel + 1; // level up
      xpInCurrentLevel = newXP - 1500; // reset, carry over excess
    }

    const leveledUp = newLevel > previousLevel;
    const xpToNextLevel = 1500 - xpInCurrentLevel;

    // Save xp (within level) and level separately
    await this.prisma.student.update({
      where: { userId },
      data: {
        xp: xpInCurrentLevel, // ✅ always 0-1499
        level: newLevel,
        lastActiveAt: new Date(),
      },
    });

    return {
      xpGained,
      totalXP: xpInCurrentLevel, // XP within current level
      previousLevel,
      currentLevel: newLevel,
      leveledUp,
      xpToNextLevel,
    };
  }

  /**
   * Get student's current gamification stats
   */
  async getStudentStats(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const xpInCurrentLevel = this.calculateXPInCurrentLevel(student.xp);
    const xpToNextLevel = 1500 - xpInCurrentLevel;
    const progressToNextLevel = (xpInCurrentLevel / 1500) * 100;

    return {
      level: student.level,
      xp: student.xp,
      xpInCurrentLevel, // XP within current level (0-1499)
      streak: student.streak,
      xpForNextLevel: 1500, // Always 1500 XP per level
      xpToNextLevel,
      progressToNextLevel: Math.round(progressToNextLevel * 100) / 100,
      lastActiveAt: student.lastActiveAt,
    };
  }

  /**
   * Update streak for student
   * Call this daily when student completes an action
   */
  async updateStreak(userId: string): Promise<number> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const now = new Date();
    const lastActive = student.lastActiveAt;

    let newStreak = student.streak;

    if (!lastActive) {
      // First time active
      newStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 0) {
        // Same day, keep streak
        newStreak = student.streak;
      } else if (daysDiff === 1) {
        // Next day, increment streak
        newStreak = student.streak + 1;
      } else {
        // Missed days, reset streak
        newStreak = 1;
      }
    }

    await this.prisma.student.update({
      where: { userId },
      data: {
        streak: newStreak,
        lastActiveAt: now,
      },
    });

    console.log(`🔥 [Gamification] Streak updated: ${newStreak}`);

    return newStreak;
  }
}
