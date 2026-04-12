import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { RankingsService } from './rankings.service';

@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) { }

  // GET /api/rankings?period=daily
  // GET /api/rankings?period=weekly
  // GET /api/rankings?period=monthly
  @Get()
  getRanking(@Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return this.rankingsService.getRanking(period);
  }

  // GET /api/rankings/history/:channelId?days=30
  // Historial de métricas de un canal específico
  @Get('history/:channelId')
  getChannelHistory(
    @Param('channelId') channelId: string,
    @Query('days') days = '30',
  ) {
    return this.rankingsService.getChannelHistory(channelId, parseInt(days));
  }

}
