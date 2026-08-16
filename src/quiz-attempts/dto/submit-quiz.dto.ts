import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class QuizAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  selectedAnswer: string; // "A", "B", "C", or "D"
}

export class SubmitQuizDto {
  @IsString()
  quizId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
