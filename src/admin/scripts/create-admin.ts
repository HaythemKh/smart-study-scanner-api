/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Script to create an admin user
 * Run with: npx ts-node src/admin/scripts/create-admin.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import { Pool } from 'pg';

// Initialize Prisma with pg adapter (same as PrismaService)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL || 'admin@smartstudyscanner.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const fullName = process.env.ADMIN_NAME || 'Admin User';

  console.log('Creating admin user...');
  console.log('Email:', email);

  try {
    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ Admin user already exists with this email');
      process.exit(1);
    }

    // Hash password
    const passwordHash: string = await bcrypt.hash(password, 10);

    // Create user and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          fullName,
          role: 'ADMIN',
          authProvider: 'EMAIL',
          isVerified: true,
          isActive: true,
        },
      });

      // Create admin profile
      const admin = await tx.admin.create({
        data: {
          userId: user.id,
          passwordHash,
        },
      });

      return { user, admin };
    });

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Email:', result.user.email);
    console.log('Password:', password);
    console.log('Role:', result.user.role);
    console.log('-----------------------------------');
    console.log('You can now login to the admin dashboard');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void createAdmin();
