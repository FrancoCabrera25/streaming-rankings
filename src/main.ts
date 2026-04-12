import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Streaming Rankings API corriendo en http://localhost:${port}/api`);
  logger.log(`📺 Canales: GET /api/channels`);
  logger.log(`🏆 Rankings: GET /api/rankings?period=daily|weekly|monthly`);
  logger.log(`🔧 Trigger manual: POST /api/metrics/collect`);
}
bootstrap();
