import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import {
  CreateTestUserDto,
  UpdateUserProfileDto,
  UpdateUserStatsDto,
} from './dto/create-user.dto';
import { UsersService } from './users.service';

// TODO: Uncomment when JWT guard is created
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user?: {
    userId: string;
    role: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a test user (for testing only)
   * POST /api/users/test
   */
  @Post('test')
  async createTestUser(@Body() dto: CreateTestUserDto) {
    return this.usersService.createUser({
      email: dto.email,
      fullName: dto.fullName || undefined,
      avatarUrl: dto.avatarUrl || undefined,
      role: dto.role || undefined,
      authProvider: dto.authProvider || undefined,
      googleId: dto.googleId || undefined,
    });
  }

  /**
   * Get all users (for testing only)
   * GET /api/users
   */
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  /**
   * Get current user profile
   * GET /api/users/me
   */
  // @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    // TODO: Get userId from JWT token (req.user.userId)
    // For now, we'll use a mock userId for testing
    const userId = req.user?.userId || 'test-user-id';
    return this.usersService.findById(userId);
  }

  /**
   * Update user profile (name, avatar)
   * PATCH /api/users/me
   */
  // @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateUserProfileDto,
  ) {
    console.log('iduser', req.user?.userId);
    const userId = req.user?.userId;
    return this.usersService.updateProfile(userId!, dto);
  }

  /**
   * Update user stats (XP, level, streak)
   * PATCH /api/users/me/stats
   */
  // @UseGuards(JwtAuthGuard)
  @Patch('me/stats')
  async updateStats(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateUserStatsDto,
  ) {
    const userId = req.user?.userId || 'test-user-id';
    return this.usersService.updateStats(userId, dto);
  }

  /**
   * Get user statistics
   * GET /api/users/me/stats
   */
  // @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  async getStats(@Request() req: RequestWithUser) {
    const userId = req.user?.userId || 'test-user-id';
    return this.usersService.getUserStats(userId);
  }

  /**
   * Delete user account
   * DELETE /api/users/me
   */
  // @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(@Request() req: RequestWithUser) {
    const userId = req.user?.userId || 'test-user-id';
    await this.usersService.deleteUser(userId);
    return { message: 'Account deleted successfully' };
  }
}
