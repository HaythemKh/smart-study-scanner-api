/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Admin, Student, User } from '@prisma/client';
import { AuthProvider, UserRole } from '../dto/create-user.dto';

/**
 * User Entity - Safe representation without sensitive data
 * This class is used to return user data to clients
 */
export class UserEntity {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;

  // Role & Auth
  role: UserRole;
  authProvider: AuthProvider;

  // Google OAuth (STUDENT only)
  googleId: string | null;

  // Account Status
  isActive: boolean;
  isVerified: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional)
  student?: Student | null;
  admin?: Admin | null;

  constructor(
    partial: Partial<User> & {
      student?: Student | null;
      admin?: Admin | null;
    },
  ) {
    Object.assign(this, partial);
    // CRITICAL: Never expose password hash
    if (this.admin) {
      delete (this.admin as any).passwordHash;
    }
  }
}
