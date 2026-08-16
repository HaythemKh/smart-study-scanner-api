import {
    Controller,
    Delete,
    Get,
    Param,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

interface AdminRequest {
  user: {
    userId: string;
    role: string;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard) // Require JWT auth and ADMIN role
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get dashboard statistics
   * GET /api/admin/stats
   */
  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * Get all users
   * GET /api/admin/users
   */
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  /**
   * Get user by ID
   * GET /api/admin/users/:id
   */
  @Get('users/:id')
  async getUserById(@Param('id') userId: string) {
    return this.adminService.getUserById(userId);
  }

  /**
   * Delete user and all associated data
   * DELETE /api/admin/users/:id
   */
  @Delete('users/:id')
  async deleteUser(@Param('id') userId: string, @Request() req: AdminRequest) {
    // Prevent admin from deleting themselves
    if (userId === req.user.userId) {
      return {
        success: false,
        message: 'You cannot delete your own account',
      };
    }
    return this.adminService.deleteUser(userId);
  }

  /**
   * Get all documents
   * GET /api/admin/documents
   */
  @Get('documents')
  async getAllDocuments() {
    return this.adminService.getAllDocuments();
  }

  /**
   * Get document by ID
   * GET /api/admin/documents/:id
   */
  @Get('documents/:id')
  async getDocumentById(@Param('id') documentId: string) {
    return this.adminService.getDocumentById(documentId);
  }

  /**
   * Delete document and all associated data
   * DELETE /api/admin/documents/:id
   */
  @Delete('documents/:id')
  async deleteDocument(@Param('id') documentId: string) {
    return this.adminService.deleteDocument(documentId);
  }
}
