import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Performance Monitoring Middleware
 * 
 * Tracks and logs:
 * - Request duration
 * - Response status codes
 * - Slow requests (> 200ms)
 * - Request size
 * - Response size
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId as string);

    // Track request size
    const requestSize = JSON.stringify(req.body || {}).length;

    // Override res.end to capture response metrics
    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: any, encoding?: any, cb?: any): Response {
      const duration = Date.now() - startTime;
      const responseSize = chunk ? Buffer.byteLength(chunk, encoding || 'utf8') : 0;

      // Log performance metrics
      const metrics = {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        requestSize,
        responseSize,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
      };

      // Log slow requests as warnings
      if (duration > 200) {
        logger.warn('Slow request detected', metrics);
      } else {
        logger.debug('Request completed', metrics);
      }

      // Add performance headers
      res.setHeader('X-Response-Time', `${duration}ms`);
      res.setHeader('X-Request-Size', `${requestSize}bytes`);
      res.setHeader('X-Response-Size', `${responseSize}bytes`);

      // Call original end
      if (cb) {
        return originalEnd(chunk, encoding, cb);
      } else if (encoding) {
        return originalEnd(chunk, encoding);
      } else if (chunk) {
        return originalEnd(chunk);
      } else {
        return originalEnd();
      }
    };

    next();
  }
}

