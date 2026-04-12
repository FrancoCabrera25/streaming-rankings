import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { YoutubeModule } from './youtube/youtube.module';
import { ChannelsModule } from './channels/channels.module';
import { MetricsModule } from './metrics/metrics.module';
import { RankingsModule } from './rankings/rankings.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // Variables de entorno disponibles globalmente
    ConfigModule.forRoot({ isGlobal: true }),

    // Habilita los decoradores @Cron, @Timeout, etc.
    ScheduleModule.forRoot(),

    // Módulos de la app
    PrismaModule,
    YoutubeModule,
    ChannelsModule,
    MetricsModule,
    RankingsModule,
    SchedulerModule,
    AiModule,
  ],
})
export class AppModule {}
