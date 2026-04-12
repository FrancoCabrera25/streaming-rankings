import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetricsService } from '../metrics/metrics.service';
import { RankingsService } from '../rankings/rankings.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly metricsService: MetricsService,
  ) { }

  /**
   * Cron: todos los días a las 23:00 hs Argentina (ART = UTC-3)
   * En cron UTC: 02:00 AM UTC del día siguiente = "0 2 * * *"
   *
   * Flujo:
   * 1. Recopila métricas de todos los canales activos (YouTube API)
   * 2. Calcula rankings diario, semanal y mensual
   */
  @Cron('0 2 * * *', {
    name: 'daily-collection',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async handleDailyCollection() {
    this.logger.log('⏰ Cron 23:00 ART — iniciando recolección diaria');

    try {
      const result = await this.metricsService.collectDailyMetrics();
      this.logger.log(`📊 Métricas: ${result.saved} OK, ${result.failed} fallidos`);

      if (result.saved > 0) {
        this.logger.log('🏆 Recolección exitosa. Los rankings se calcularán dinámicamente mediante la API la próxima vez que se consulten.');
      } else {
        this.logger.warn('⚠️  Sin métricas guardadas, se omite el cálculo de rankings');
      }
    } catch (err) {
      this.logger.error(`💥 Error en la recolección diaria: ${err.message}`, err.stack);
    }
  }
}
