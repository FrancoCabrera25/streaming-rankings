import { Controller, Post, Get, Logger, Headers, UnauthorizedException } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  private readonly logger = new Logger(SchedulerController.name);

  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('daily')
  @Post('daily')
  async triggerDailyCollection(@Headers('authorization') authHeader?: string) {
    const cronSecret = process.env.CRON_SECRET;
    
    // Si la variable CRON_SECRET está configurada, validamos la petición
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        this.logger.warn('Intento de ejecución de cron no autorizado');
        throw new UnauthorizedException('Invalid cron secret');
      }
    }

    this.logger.log('🔄 Triggering daily collection via API');
    await this.schedulerService.handleDailyCollection();
    return { message: 'Daily collection triggered' };
  }
}