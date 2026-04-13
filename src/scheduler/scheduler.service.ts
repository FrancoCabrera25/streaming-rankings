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
   * Método para recolección diaria de métricas.
   * Se ejecuta vía API endpoint en Vercel (cron configurado en vercel.json a las 23:30 ART).
   *
   * Flujo:
   * 1. Recopila métricas de todos los canales activos (YouTube API)
   * 2. Calcula rankings diario, semanal y mensual
   */
  async handleDailyCollection() {
    this.logger.log('⏰ Cron 23:30 ART — iniciando recolección diaria');

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
