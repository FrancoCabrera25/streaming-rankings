import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { YoutubeModule } from './youtube/youtube.module';
import { ChannelsModule } from './channels/channels.module';
import { MetricsModule } from './metrics/metrics.module';
import { RankingsModule } from './rankings/rankings.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Variables de entorno disponibles globalmente
    ConfigModule.forRoot({ isGlobal: true }),

    // Habilita los decoradores @Cron, @Timeout, etc.
    ScheduleModule.forRoot(),

    // Protege con rate limit global
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.THROTTLE_TTL ?? 60),
          limit: Number(process.env.THROTTLE_LIMIT ?? 20),
        },
      ],
    }),

    // Módulos de la app
    PrismaModule,
    YoutubeModule,
    ChannelsModule,
    MetricsModule,
    RankingsModule,
    SchedulerModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
