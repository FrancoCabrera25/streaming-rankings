import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeService } from '../youtube/youtube.service';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeService: YoutubeService,
  ) { }

  async findAll() {
    return this.prisma.channel.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Agrega un canal por su YouTube Channel ID (UCxxxxxxxxxx)
   * Consulta YouTube para obtener el nombre y metadata automáticamente.
   */
  async addByChannelId(youtubeChannelId: string) {
    const [stats] = await this.youtubeService.getChannelsStats([youtubeChannelId]);
    if (!stats) {
      throw new NotFoundException(`Canal ${youtubeChannelId} no encontrado en YouTube`);
    }
    return this.upsertChannel(youtubeChannelId, stats);
  }

  /**
   * Agrega un canal por su handle (@luzutv)
   * Primero resuelve el handle al channel ID, luego obtiene los datos.
   */
  async addByHandle(handle: string) {
    const channelId = await this.youtubeService.getChannelIdByHandle(handle);
    if (!channelId) {
      throw new NotFoundException(`Handle ${handle} no encontrado en YouTube`);
    }
    return this.addByChannelId(channelId);
  }

  async deactivate(id: string) {
    return this.prisma.channel.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Seed inicial con los canales de streaming más importantes de Argentina.
   * Para obtener los IDs: https://www.youtube.com/@HANDLE -> ver código fuente
   * o usar GET /api/channels/resolve/:handle
   */
  async seedArgentineChannels() {
    // Lista de canales conocidos — completar con los IDs reales.
    // Para encontrar el channel ID de un canal:
    //   1. Ir a youtube.com/@handle
    //   2. Click en "Compartir" → "Copiar el ID del canal"
    //   O usar el endpoint: GET /api/channels/resolve/:handle
    const channels: any = [
      // Descomenta y agrega los channel IDs reales:
      // { id: 'UC_CHANNEL_ID_AQUI', name: 'Luzu TV' },
      // { id: 'UC_CHANNEL_ID_AQUI', name: 'Olga' },
      // { id: 'UC_CHANNEL_ID_AQUI', name: 'Blender' },
      // { id: 'UC_CHANNEL_ID_AQUI', name: 'Vorterix' },
      // { id: 'UC_CHANNEL_ID_AQUI', name: 'Gelatina' },
    ];

    if (channels.length === 0) {
      this.logger.warn('No hay canales en el seed. Agregá los channel IDs en channels.service.ts o usá POST /api/channels');
      return { message: 'Sin canales en el seed', added: 0 };
    }

    let added = 0;
    for (const ch of channels) {
      await this.prisma.channel.upsert({
        where: { youtubeChannelId: ch.id },
        update: { active: true },
        create: { youtubeChannelId: ch.id, name: ch.name },
      });
      added++;
    }

    return { message: `${added} canales seeded`, added };
  }

  private async upsertChannel(youtubeChannelId: string, stats: any) {
    return this.prisma.channel.upsert({
      where: { youtubeChannelId },
      update: {
        active: true,
        name: stats.name,
        handle: stats.handle,
        thumbnailUrl: stats.thumbnailUrl,
        description: stats.description,
        country: stats.country,
      },
      create: {
        youtubeChannelId,
        name: stats.name,
        handle: stats.handle,
        description: stats.description,
        country: stats.country,
        thumbnailUrl: stats.thumbnailUrl,
        publishedAt: stats.publishedAt,
      },
    });
  }
}
