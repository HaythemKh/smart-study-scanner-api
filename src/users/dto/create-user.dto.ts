import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// Enums matching Prisma schema
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
}

export enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
}

// ============================================
// TEST USER DTO (for testing only)
// ============================================

export class CreateTestUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(AuthProvider)
  @IsOptional()
  authProvider?: AuthProvider;

  @IsString()
  @IsOptional()
  googleId?: string;
}

// ============================================
// ADMIN DTOs (Email/Password Authentication)
// ============================================

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;
}

export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// ============================================
// STUDENT DTOs (Google OAuth Authentication)
// ============================================

export class GoogleAuthDto {
  @IsString()
  googleToken: string; // ID token from Google Sign-In
}

// Internal DTO (not exposed via API)
export class CreateStudentDto {
  @IsEmail()
  email: string;

  @IsString()
  googleId: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

// ============================================
// UPDATE DTOs
// ============================================

export class UpdateUserProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateUserStatsDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  xp?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  level?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  streak?: number;
}
