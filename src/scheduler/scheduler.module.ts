import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { RankingsModule } from '../rankings/rankings.module';

@Module({
  imports: [MetricsModule, RankingsModule],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}
