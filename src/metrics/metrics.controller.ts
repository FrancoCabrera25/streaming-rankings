import { Controller, Post } from '@nestjs/common';
import { MetricsService } from './metrics.service';

// Endpoint para disparar la recolección manualmente (útil para testing)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // POST /api/metrics/collect — recolecta datos ahora sin esperar el cron
  @Post('collect')
  collectNow() {
    return this.metricsService.collectDailyMetrics();
  }
}
