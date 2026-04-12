import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { YoutubeModule } from '../youtube/youtube.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [YoutubeModule, AiModule],
  providers: [MetricsService],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule { }
