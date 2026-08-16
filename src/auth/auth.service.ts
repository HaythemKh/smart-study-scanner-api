/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import {
  AdminLoginDto,
  GoogleAuthDto,
  UserRole,
} from '../users/dto/create-user.dto';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(clientId);
  }

  /**
   * Admin login with email and password
   */
  async adminLogin(dto: AdminLoginDto): Promise<{
    success: boolean;
    accessToken: string;
    user: {
      id: string;
      email: string;
      fullName: string | null;
      avatarUrl: string | null;
      role: string;
    };
  }> {
    try {
      console.log('🔵 [AUTH] Admin login attempt for:', dto.email);

      // Find admin user by email with admin relation
      const user = await this.usersService.findByEmail(dto.email);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is admin
      if (user.role !== UserRole.ADMIN) {
        throw new UnauthorizedException('Admin access required');
      }

      // Get admin data with password hash
      const adminData = await this.usersService.getAdminData(user.id);

      if (!adminData || !adminData.passwordHash) {
        throw new UnauthorizedException('Invalid authentication method');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        dto.password,
        adminData.passwordHash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const accessToken = this.generateJWT(user.id, user.role);

      console.log('✅ [AUTH] Admin login successful for:', user.email);

      return {
        success: true,
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('❌ [AUTH] Admin login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Verify Google token and create/login user
   */
  async googleLogin(dto: GoogleAuthDto) {
    try {
      console.log('🔵 [AUTH] Starting Google token verification...');
      console.log(
        '🔵 [AUTH] Token preview:',
        dto.googleToken?.substring(0, 50) + '...',
      );
      console.log(
        '🔵 [AUTH] Client ID:',
        this.configService.get<string>('GOOGLE_CLIENT_ID')?.substring(0, 20) +
          '...',
      );

      // Verify Google token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.googleToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      console.log('✅ [AUTH] Token verified successfully');

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      console.log('🔵 [AUTH] Payload received:', {
        email: payload.email,
        name: payload.name,
        sub: payload.sub,
      });

      // Extract user info from Google
      const googleId = payload.sub;
      const email = payload.email;
      const fullName = payload.name;
      const avatarUrl = payload.picture;

      if (!email || !googleId) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      // Find or create user
      const existingUser = await this.usersService.findByGoogleId(googleId);

      let user: UserEntity;

      if (!existingUser) {
        console.log('🔵 [AUTH] Creating new user with Student profile...');
        // Create new user with Student profile and Library
        user = await this.usersService.createUser({
          email,
          googleId,
          fullName: fullName || undefined,
          avatarUrl: avatarUrl || undefined,
          role: 'STUDENT',
          authProvider: 'GOOGLE',
        });
        // Refetch to include student data
        user = await this.usersService.findById(user.id);
      } else {
        console.log('🔵 [AUTH] User exists, updating streak...');
        // Update last active and streak
        await this.usersService.updateStreak(existingUser.id);
        // Refetch user to get updated data
        user = await this.usersService.findById(existingUser.id);
      }

      // Generate JWT token
      const accessToken = this.generateJWT(user.id, user.role);

      console.log('✅ [AUTH] Login successful for:', user.email);

      // Build response with student data if available
      const response: {
        accessToken: string;
        user: {
          id: string;
          email: string;
          fullName: string | null;
          avatarUrl: string | null;
          role: string;
          level?: number;
          xp?: number;
          streak?: number;
        };
      } = {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      };

      // Add student stats if user is a student
      if (user.role === UserRole.STUDENT && user.student) {
        response.user.level = user.student.level;
        response.user.xp = user.student.xp;
        response.user.streak = user.student.streak;
      }

      return response;
    } catch (error) {
      console.error('❌ [AUTH] Google login error:', error);
      console.error('❌ [AUTH] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  /**
   * Generate JWT token
   */
  generateJWT(userId: string, role: string): string {
    const payload = {
      sub: userId,
      userId,
      role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string; role: string; sub: string } {
    try {
      const decoded = this.jwtService.verify<{
        userId: string;
        role: string;
        sub: string;
      }>(token);
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Refresh token (generate new token)
   */
  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);

    const accessToken = this.generateJWT(user.id, user.role);

    const response: {
      accessToken: string;
      user: {
        id: string;
        email: string;
        fullName: string | null;
        avatarUrl: string | null;
        role: string;
        level?: number;
        xp?: number;
        streak?: number;
      };
    } = {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };

    // Add student stats if user is a student
    if (user.role === UserRole.STUDENT && user.student) {
      response.user.level = user.student.level;
      response.user.xp = user.student.xp;
      response.user.streak = user.student.streak;
    }

    return response;
  }
}
