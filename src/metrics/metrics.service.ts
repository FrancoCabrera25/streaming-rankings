import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeService } from '../youtube/youtube.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeService: YoutubeService,
    private readonly aiService: AiService,
  ) { }

  /**
   * Recopila métricas de todos los canales activos y guarda un snapshot.
   * Se llama automáticamente desde el Scheduler a las 23:00 hs ART.
   * También puede llamarse manualmente desde POST /api/metrics/collect
   */
  async collectDailyMetrics(date?: Date): Promise<{ saved: number; failed: number }> {
    const targetDate = this.getDateOnly(date ?? new Date());

    this.logger.log(`📊 Iniciando recolección de métricas para ${targetDate.toISOString().split('T')[0]}`);

    const channels = await this.prisma.channel.findMany({
      where: { active: true },
    });

    if (channels.length === 0) {
      this.logger.warn('⚠️  No hay canales activos. Agregá canales con POST /api/channels');
      return { saved: 0, failed: 0 };
    }

    this.logger.log(`📺 Procesando ${channels.length} canales...`);

    const channelIds = channels.map((c) => c.youtubeChannelId);
    const statsArray = await this.youtubeService.getChannelsStats(channelIds);

    // Convertir array a mapa para acceso rápido
    const statsMap = new Map(statsArray.map((s) => [s.youtubeChannelId, s]));

    // Construimos la tabla global rápida para darle contexto a la IA de cómo le fue al resto hoy
    const globalLeaderboard = channels.map(c => {
      const st = statsMap.get(c.youtubeChannelId);
      return {
        name: c.name,
        subscribers: st?.subscribers?.toString(),
        totalViews: st?.totalViews?.toString()
      };
    });

    // Fecha de ayer para buscar comparaciones
    const yesterdayDate = new Date(targetDate);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);

    let saved = 0;
    let failed = 0;

    for (const channel of channels) {
      const stats = statsMap.get(channel.youtubeChannelId);
      if (!stats) {
        this.logger.warn(`Sin datos para: ${channel.name} (${channel.youtubeChannelId})`);
        failed++;
        continue;
      }

      try {
        await this.prisma.channelSnapshot.upsert({
          where: {
            channelId_date: {
              channelId: channel.id,
              date: targetDate,
            },
          },
          update: {
            subscribers: stats.subscribers,
            totalViews: stats.totalViews,
            videoCount: stats.videoCount,
          },
          create: {
            channelId: channel.id,
            date: targetDate,
            subscribers: stats.subscribers,
            totalViews: stats.totalViews,
            videoCount: stats.videoCount,
          },
        });

        // Actualizar metadata del canal (nombre, handle, thumbnail pueden cambiar)
        await this.prisma.channel.update({
          where: { id: channel.id },
          data: {
            name: stats.name,
            handle: stats.handle ?? channel.handle,
            thumbnailUrl: stats.thumbnailUrl ?? channel.thumbnailUrl,
          },
        });

        // ==========================================
        // NUEVO ENFOQUE: ETL en memoria para usar luego con IA
        // ==========================================
        try {
          const existingInsight = await this.prisma.dailyAiInsight.findUnique({
            where: { channelId_date: { channelId: channel.id, date: targetDate } }
          });

          if (!existingInsight) {
            const recentVideos = await this.youtubeService.getRecentVideosByChannel(channel.youtubeChannelId, 5);
            let aiContext: any = null;

            if (recentVideos.length > 0) {
              const videoIds = recentVideos.map(v => v.youtubeVideoId);
              const videosStats = await this.youtubeService.getVideosStats(videoIds);

              // Armamos la info para la IA, SIN guardarla en tablas SQL
              aiContext = recentVideos.map(rv => {
                const vStats = videosStats.find(vs => vs.youtubeVideoId === rv.youtubeVideoId);
                return {
                  title: rv.title,
                  publishedAt: rv.publishedAt,
                  views: vStats?.views?.toString(),
                  concurrentViewers: vStats?.concurrentViewers?.toString(),
                };
              });
            }

            // Buscamos stats de ayer para que pueda comparar
            const yesterdaySnapshot = await this.prisma.channelSnapshot.findUnique({
              where: { channelId_date: { channelId: channel.id, date: yesterdayDate } }
            });

            const yesterdayStats = yesterdaySnapshot ? {
              subscribers: yesterdaySnapshot.subscribers.toString(),
              totalViews: yesterdaySnapshot.totalViews.toString(),
            } : null;

            // Llamamos a Gemini
            const insightText = await this.aiService.generateDailyInsight(
              channel.name,
              { subscribers: stats.subscribers.toString(), totalViews: stats.totalViews.toString() },
              aiContext,
              yesterdayStats,
              globalLeaderboard
            );

            if (insightText) {
              await this.prisma.dailyAiInsight.create({
                data: {
                  channelId: channel.id,
                  date: targetDate,
                  insightText,
                  promptContext: JSON.stringify({ stats: { subscribers: stats.subscribers.toString(), totalViews: stats.totalViews.toString() }, yesterdayStats, aiContext, globalLeaderboard })
                }
              });
              this.logger.debug(`🧠 IA Insight guardado para ${channel.name}`);
            }
          } else {
            this.logger.debug(`⏭️ IA Insight ya existía hoy para ${channel.name}. Se omite generarlo nuevamente.`);
          }
        } catch (vErr) {
          this.logger.error(`⚠️ Error armando contexto IA para ${channel.name}: ${vErr.message}`);
        }

        saved++;
        this.logger.debug(`✅ ${channel.name}: ${stats.subscribers.toLocaleString()} suscriptores`);
      } catch (err) {
        this.logger.error(`❌ Error guardando ${channel.name}: ${err.message}`);
        failed++;
      }
    }

    this.logger.log(`✅ Recolección completa: ${saved} guardados, ${failed} fallidos`);
    return { saved, failed };
  }

  // Devuelve solo la fecha (sin horas) en UTC para evitar problemas de timezone
  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}
