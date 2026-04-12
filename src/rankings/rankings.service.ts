import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Period = 'daily' | 'weekly' | 'monthly';

@Injectable()
export class RankingsService {
  private readonly logger = new Logger(RankingsService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Devuelve el ranking más reciente calculado "al vuelo" o "on-demand",
   * comparando la fecha de recolección más reciente contra el período dado.
   * GET /api/rankings?period=daily|weekly|monthly
   */
  async getRanking(period: Period = 'daily') {
    // 1. Encontrar la fecha más reciente con datos (A)
    const latestSnapshot = await this.prisma.channelSnapshot.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (!latestSnapshot) {
      return { period, date: null, rankings: [] };
    }

    const latestDate = latestSnapshot.date;

    // 2. Traer todos los snapshots de la fecha actual (A)
    const currentSnapshots = await this.prisma.channelSnapshot.findMany({
      where: { date: latestDate },
      include: { channel: { select: { id: true, name: true, handle: true, thumbnailUrl: true } } },
    });

    // 3. Traer todos los snapshots correspondientes al margen de días especificado atrás (B)
    const daysMap: Record<Period, number> = { daily: 1, weekly: 7, monthly: 30 };
    const days = daysMap[period] ?? 1;

    const fromDate = new Date(latestDate);
    fromDate.setDate(fromDate.getDate() - days);

    // Traemos todos los de `fromDate` al `latestDate` excluído para encontrar lo más cercano a "fromDate"
    const pastSnapshots = await this.prisma.channelSnapshot.findMany({
      where: {
        date: { gte: fromDate, lt: latestDate },
        channelId: { in: currentSnapshots.map(s => s.channelId) }
      },
      orderBy: { date: 'asc' }, // El primero será el más viejo/cercano a fromDate
    });

    const oldestInPeriod = new Map<string, typeof pastSnapshots[0]>();
    for (const snap of pastSnapshots) {
      if (!oldestInPeriod.has(snap.channelId)) {
        oldestInPeriod.set(snap.channelId, snap);
      }
    }

    // 4. Buscar también los insights generados por la IA en latestDate
    const insights = await this.prisma.dailyAiInsight.findMany({
      where: { date: latestDate }
    });
    const insightsMap = new Map(insights.map(i => [i.channelId, i.insightText]));

    // 5. Calcular los Deltas y ordenar por total de suscriptores
    const rankingsRaw = currentSnapshots.map((snap) => {
      const oldest = oldestInPeriod.get(snap.channelId);
      const subscriberDelta = oldest ? snap.subscribers - oldest.subscribers : BigInt(0);
      const viewsDelta = oldest ? snap.totalViews - oldest.totalViews : BigInt(0);

      return {
        snap,
        subscriberDelta,
        viewsDelta,
      };
    });

    // Ordenamiento Top 1 (por cantidad de subs)
    rankingsRaw.sort((a, b) => a.snap.subscribers > b.snap.subscribers ? -1 : a.snap.subscribers < b.snap.subscribers ? 1 : 0);

    return {
      period,
      date: latestDate,
      rankings: rankingsRaw.map((r, i) => ({
        rank: i + 1,
        channel: {
          id: r.snap.channelId,
          name: r.snap.channel.name,
          handle: r.snap.channel.handle,
          thumbnailUrl: r.snap.channel.thumbnailUrl,
        },
        subscribers: r.snap.subscribers.toString(),
        totalViews: r.snap.totalViews.toString(),
        videoCount: r.snap.videoCount,
        growth: {
          subscribers: r.subscriberDelta.toString(),
          views: r.viewsDelta.toString(),
        },
        aiInsight: insightsMap.get(r.snap.channelId) ?? null,
      })),
    };
  }

  /**
   * Histórico de snapshots de un canal específico (últimos N días).
   * GET /api/rankings/history/:channelId?days=30
   */
  async getChannelHistory(channelId: string, days = 30) {
    const snapshots = await this.prisma.channelSnapshot.findMany({
      where: { channelId },
      orderBy: { date: 'desc' },
      take: days,
    });

    return snapshots.map((s) => ({
      date: s.date,
      subscribers: s.subscribers.toString(),
      totalViews: s.totalViews.toString(),
      videoCount: s.videoCount,
    }));
  }
}
