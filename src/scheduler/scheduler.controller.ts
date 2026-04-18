import { Controller, Post, Get, Logger } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  private readonly logger = new Logger(SchedulerController.name);

  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('daily')
  @Post('daily')
  async triggerDailyCollection() {
    this.logger.log('🔄 Triggering daily collection via API');
    await this.schedulerService.handleDailyCollection();
    return { message: 'Daily collection triggered' };
  }
}