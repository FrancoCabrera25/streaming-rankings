import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { YoutubeChannelStats, YoutubeVideo, YoutubeVideoStats } from './youtube.types';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('YOUTUBE_API_KEY');
  }

  /**
   * Obtiene estadísticas de múltiples canales.
   * La API permite hasta 50 IDs por request, por eso se hace en batches.
   */
  async getChannelsStats(channelIds: string[]): Promise<YoutubeChannelStats[]> {
    const results: YoutubeChannelStats[] = [];

    for (let i = 0; i < channelIds.length; i += 50) {
      const batch = channelIds.slice(i, i + 50);
      const batchResults = await this.fetchChannelsBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Resuelve el channel ID a partir del handle (@luzutv → UCxxxxxxxx)
   * Útil para agregar canales nuevos.
   */
  async getChannelIdByHandle(handle: string): Promise<string | null> {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const url = this.buildUrl('channels', {
      part: 'id',
      forHandle: cleanHandle,
    });

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      this.logger.error(`YouTube API error: ${JSON.stringify(data.error)}`);
      throw new Error(`YouTube API: ${data.error.message}`);
    }

    return data.items?.[0]?.id ?? null;
  }

  private async fetchChannelsBatch(channelIds: string[]): Promise<YoutubeChannelStats[]> {
    const url = this.buildUrl('channels', {
      part: 'statistics,snippet',
      id: channelIds.join(','),
    });

    this.logger.debug(`Fetching ${channelIds.length} canales de YouTube API`);

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YouTube API ${response.status}: ${error}`);
    }

    const data = await response.json();

    if (data.error) {
      this.logger.error(`YouTube API error: ${JSON.stringify(data.error)}`);
      throw new Error(`YouTube API: ${data.error.message}`);
    }

    if (!data.items?.length) {
      this.logger.warn(`Sin resultados para: ${channelIds.join(', ')}`);
      return [];
    }

    return data.items.map((item: any): YoutubeChannelStats => ({
      youtubeChannelId: item.id,
      name: item.snippet.title,
      handle: item.snippet.customUrl,     // Ej: "@luzutv"
      description: item.snippet.description?.substring(0, 500), // Max 500 chars
      country: item.snippet.country,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url,
      publishedAt: item.snippet.publishedAt
        ? new Date(item.snippet.publishedAt)
        : undefined,

      // Algunos canales ocultan sus suscriptores (hiddenSubscriberCount: true)
      // En ese caso subscriberCount no existe en la respuesta
      subscribers: BigInt(item.statistics.subscriberCount ?? '0'),
      totalViews: BigInt(item.statistics.viewCount ?? '0'),
      videoCount: parseInt(item.statistics.videoCount ?? '0'),
      hiddenSubscriberCount: item.statistics.hiddenSubscriberCount ?? false,
    }));
  }

  /**
   * Obtiene los últimos videos subidos por un canal.
   * IMPORTANTE: 'search' gasta 100 puntos de cuota por query.
   */
  async getRecentVideosByChannel(youtubeChannelId: string, maxResults = 5): Promise<YoutubeVideo[]> {
    const url = this.buildUrl('search', {
      part: 'snippet',
      channelId: youtubeChannelId,
      order: 'date',
      type: 'video',
      maxResults: maxResults.toString(),
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    if (!data.items?.length) return [];

    return data.items.map((item: any): YoutubeVideo => ({
      youtubeVideoId: item.id.videoId,
      youtubeChannelId: item.snippet.channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt ? new Date(item.snippet.publishedAt) : undefined,
    }));
  }

  /**
   * Obtiene estadísticas de videos específicos (incluyendo concurrent viewers si es live).
   * Gasta 1 punto de cuota.
   */
  async getVideosStats(youtubeVideoIds: string[]): Promise<YoutubeVideoStats[]> {
    if (!youtubeVideoIds.length) return [];

    const results: YoutubeVideoStats[] = [];

    // Hacemos batches de 50
    for (let i = 0; i < youtubeVideoIds.length; i += 50) {
      const batch = youtubeVideoIds.slice(i, i + 50);
      const url = this.buildUrl('videos', {
        part: 'statistics,liveStreamingDetails',
        id: batch.join(','),
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`YouTube API ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      if (!data.items?.length) continue;

      const batchResults = data.items.map((item: any): YoutubeVideoStats => ({
        youtubeVideoId: item.id,
        views: BigInt(item.statistics?.viewCount ?? '0'),
        likes: item.statistics?.likeCount ? BigInt(item.statistics.likeCount) : undefined,
        comments: item.statistics?.commentCount ? BigInt(item.statistics.commentCount) : undefined,
        concurrentViewers: item.liveStreamingDetails?.concurrentViewers
          ? BigInt(item.liveStreamingDetails.concurrentViewers)
          : undefined,
      }));

      results.push(...batchResults);
    }

    return results;
  }

  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const query = new URLSearchParams({ ...params, key: this.apiKey });
    return `${this.baseUrl}/${endpoint}?${query.toString()}`;
  }
}
