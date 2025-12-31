import { Controller, Get } from '@nestjs/common';

/**
 * Health Check Controller
 * 
 * Provides health check endpoints for monitoring and load balancers
 */
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'workspace-platform-backend',
    };
  }

  @Get('ready')
  readiness() {
    // Add readiness checks here (database, redis, etc.)
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  liveness() {
    // Add liveness checks here
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}

