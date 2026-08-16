import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AdminLoginDto, GoogleAuthDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
    role: string;
    fullName: string | null;
    avatarUrl: string | null;
    level: number;
    xp: number;
    streak: number;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Admin Login (Email/Password)
   * POST /api/auth/admin/login
   */
  @Post('admin/login')
  adminLogin(@Body() dto: AdminLoginDto) {
    console.log('🔵 [AUTH] Admin login endpoint called');
    console.log('🔵 [AUTH] Email:', dto.email);
    return this.authService.adminLogin(dto);
  }

  /**
   * Google OAuth Login
   * POST /api/auth/google
   */
  @Post('google')
  googleLogin(@Body() dto: GoogleAuthDto) {
    console.log('🔵 [AUTH] Google login endpoint called');
    console.log('🔵 [AUTH] Request received from mobile app');
    console.log('🔵 [AUTH] Token length:', dto.googleToken?.length || 0);
    return this.authService.googleLogin(dto);
  }

  /**
   * Refresh Token
   * POST /api/auth/refresh
   */
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refreshToken(@Request() req: AuthRequest) {
    return this.authService.refreshToken(req.user.userId);
  }

  /**
   * Get Current User (verify token)
   * GET /api/auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Request() req: AuthRequest) {
    return req.user;
  }

  /**
   * Verify Token
   * POST /api/auth/verify
   */
  @Post('verify')
  verifyToken(@Body() body: { token: string }) {
    return this.authService.verifyToken(body.token);
  }
}
