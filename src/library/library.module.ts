import { Module } from '@nestjs/common';
import { AiGenerationModule } from '../ai-generation/ai-generation.module';
import { DocumentModule } from '../document/document.module';
import { FlashcardModule } from '../flashcard/flashcard.module';
import { GamificationModule } from '../gamification/gamification.module';
import { QuizModule } from '../quiz/quiz.module';
import { SummaryModule } from '../summary/summary.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [
    DocumentModule,
    SummaryModule,
    QuizModule,
    FlashcardModule,
    AiGenerationModule,
    GamificationModule,
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
