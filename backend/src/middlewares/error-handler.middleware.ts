import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

@Catch()
export class ErrorHandlerMiddleware implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const errorObj = exceptionResponse as any;
        message = errorObj.message || exception.message;
        errorCode = errorObj.error || errorObj.code || 'HTTP_EXCEPTION';
        details = errorObj.details || null;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = 'ERROR';
    }

    // Log error
    logger.error('Error occurred', {
      error: message,
      statusCode: status,
      path: request.url,
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Send error response
    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id'] || 'unknown',
    });
  }
}

