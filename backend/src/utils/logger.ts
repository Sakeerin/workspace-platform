import winston = require('winston');
import { env } from '../config/env';
import * as path from 'path';
import * as fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

/**
 * Enhanced Application Logger
 * 
 * Features:
 * - Structured JSON logging for production
 * - Colorized console output for development
 * - Separate error and combined log files
 * - Request ID tracking
 * - Performance metrics logging
 */
export const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { 
    service: 'workspace-platform',
    environment: env.nodeEnv,
  },
  transports: [
    // Error log file (errors only)
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file (all levels)
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Access log file (HTTP requests)
    new winston.transports.File({ 
      filename: path.join(logsDir, 'access.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for non-production environments
if (env.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Log helper methods for common scenarios
 */
export const logHelpers = {
  /**
   * Log API request
   */
  logRequest: (req: any, duration?: number) => {
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      statusCode: req.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  },

  /**
   * Log API error
   */
  logError: (error: Error, context?: any) => {
    logger.error('API Error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  },

  /**
   * Log database query
   */
  logQuery: (query: string, duration: number, params?: any) => {
    if (duration > 100) {
      logger.warn('Slow database query', { query, duration, params });
    } else {
      logger.debug('Database query', { query, duration });
    }
  },

  /**
   * Log performance metric
   */
  logPerformance: (metric: string, value: number, unit: string = 'ms') => {
    logger.info('Performance Metric', {
      metric,
      value,
      unit,
    });
  },
};

export default logger;

