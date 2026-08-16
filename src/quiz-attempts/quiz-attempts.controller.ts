import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizAttemptsService } from './quiz-attempts.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizAttemptsController {
  private readonly logger = new Logger(QuizAttemptsController.name);

  constructor(private readonly quizAttemptsService: QuizAttemptsService) {}

  /**
   * Submit quiz answers and get results
   * POST /quizzes/submit
   */
  @Post('submit')
  async submitQuiz(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SubmitQuizDto,
  ) {
    this.logger.log(`📝 POST /quizzes/submit`);
    this.logger.log(`👤 User: ${req.user.userId}`);
    this.logger.log(`📋 Quiz: ${dto.quizId}`);

    return this.quizAttemptsService.submitAttempt(req.user.userId, dto);
  }

  /**
   * Get attempt for a specific quiz
   * GET /quizzes/:quizId/attempts
   */
  @Get(':quizId/attempts')
  async getQuizAttempt(
    @Request() req: AuthenticatedRequest,
    @Param('quizId') quizId: string,
  ) {
    this.logger.log(`📜 GET /quizzes/${quizId}/attempts`);
    this.logger.log(`👤 User: ${req.user.userId}`);

    return this.quizAttemptsService.getAttempt(req.user.userId, quizId);
  }

  /**
   * Get all attempts for the authenticated user
   * GET /quizzes/attempts/all
   */
  @Get('attempts/all')
  async getAllUserAttempts(@Request() req: AuthenticatedRequest) {
    this.logger.log(`📚 GET /quizzes/attempts/all`);
    this.logger.log(`👤 User: ${req.user.userId}`);

    return this.quizAttemptsService.getUserAttempts(req.user.userId);
  }
}
