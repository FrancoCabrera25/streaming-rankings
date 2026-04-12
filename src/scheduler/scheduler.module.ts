import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { MetricsModule } from '../metrics/metrics.module';
import { RankingsModule } from '../rankings/rankings.module';

@Module({
  imports: [MetricsModule, RankingsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
