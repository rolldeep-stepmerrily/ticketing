import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

import { Response } from 'express';

interface IErrorResponse {
  message: string;
  errorCode?: string;
  [key: string]: unknown;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const error: IErrorResponse =
      typeof exceptionResponse === 'string' ? { message: exceptionResponse } : (exceptionResponse as IErrorResponse);

    const errorCodeByStatus: Record<number, string> = {
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED_KEY',
      [HttpStatus.BAD_REQUEST]: 'INVALID_REQUEST',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    };

    const errorCode = error.errorCode ?? errorCodeByStatus[statusCode] ?? 'UNDEFINED_ERROR_CODE';

    const messageByStatus: Record<number, string> = {
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later.',
    };

    const message = messageByStatus[statusCode] ?? error.message ?? 'UNDEFINED_ERROR_MESSAGE';

    response.status(statusCode).json({
      statusCode,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
