/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';

/**
 * I use those classes just to make it easy for the frontend to catch specific errors champs if there is any errors
 * ******Optimized Filtre
 *  */

export class ValidationException extends BadRequestException {
  constructor(public validationErrors: any) {
    super();
  }
}

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    return response.status(400).json({
      statusCode: 400,
      success: false,
      message: '',
      error: exception.validationErrors,
    });
  }
}
