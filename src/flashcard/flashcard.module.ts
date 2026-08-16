import { Module } from '@nestjs/common';
import { FlashcardService } from './flashcard.service';

@Module({
  providers: [FlashcardService],
  exports: [FlashcardService],
})
export class FlashcardModule {}
