import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors();
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Streaming Rankings API corriendo en http://localhost:${port}/api`);
  logger.log(`📺 Canales: GET /api/channels`);
  logger.log(`🏆 Rankings: GET /api/rankings?period=daily|weekly|monthly`);
  logger.log(`🔧 Trigger manual: POST /api/metrics/collect`);
}
bootstrap();
