import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('RentFlowBootstrap');
  const app = await NestFactory.create(AppModule);

  // Global API Route Prefix
  app.setGlobalPrefix('api/v1');

  // Global Input Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Standardized Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Standardized Response Envelope
  app.useGlobalInterceptors(new TransformInterceptor());

  // Enable Cross-Origin Resource Sharing (CORS)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 RentFlow Backend API is running on http://0.0.0.0:${port}/api/v1`);

}

bootstrap();
