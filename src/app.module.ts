import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { LibraryModule } from './library/library.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuizAttemptsModule } from './quiz-attempts/quiz-attempts.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    LibraryModule, // New clean modular structure
    AdminModule, // Admin dashboard module
    QuizAttemptsModule, // Quiz attempts tracking
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
