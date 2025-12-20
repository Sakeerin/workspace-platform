import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { env } from './config/env';
import { Server as HTTPServer } from 'http';
import { setupSocketIO } from './websocket/socket.config';
import { WebSocketService } from './services/websocket.service';
import { BlockService } from './services/block.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: env.cors.origin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Error handling
  app.useGlobalFilters(new ErrorHandlerMiddleware());

  // API prefix
  app.setGlobalPrefix(`api/${env.apiVersion}`);

  // Setup WebSocket
  const httpServer: HTTPServer = app.getHttpServer() as HTTPServer;
  const ioServer = setupSocketIO(httpServer);
  const websocketService = new WebSocketService(ioServer);

  // Integrate WebSocket with BlockService
  const blockService = app.get(BlockService);
  if (blockService) {
    blockService.setWebSocketService(websocketService);
  }

  await app.listen(env.port);
  console.log(`Application is running on: http://localhost:${env.port}`);
  console.log(`WebSocket server is running on: ws://localhost:${env.port}`);
}
bootstrap();

