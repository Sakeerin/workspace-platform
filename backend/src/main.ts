import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { env } from './config/env';

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

  await app.listen(env.port);
  console.log(`Application is running on: http://localhost:${env.port}`);
}
bootstrap();

