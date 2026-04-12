import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  // GET /api/channels — lista todos los canales activos
  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  // GET /api/channels/resolve/:handle — resuelve @handle → channel ID
  // Ejemplo: GET /api/channels/resolve/@luzutv
  @Get('resolve/:handle')
  resolveHandle(@Param('handle') handle: string) {
    return this.channelsService.addByHandle(handle);
  }

  // POST /api/channels — agrega un canal por YouTube Channel ID
  // Body: { "youtubeChannelId": "UCxxxxxxxxxx" }
  @Post()
  addByChannelId(@Body() body: { youtubeChannelId: string }) {
    return this.channelsService.addByChannelId(body.youtubeChannelId);
  }

  // POST /api/channels/by-handle — agrega por handle
  // Body: { "handle": "@luzutv" }
  @Post('by-handle')
  addByHandle(@Body() body: { handle: string }) {
    return this.channelsService.addByHandle(body.handle);
  }

  // POST /api/channels/seed — carga los canales argentinos predefinidos
  @Post('seed')
  seed() {
    return this.channelsService.seedArgentineChannels();
  }

  // DELETE /api/channels/:id — desactiva un canal
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.channelsService.deactivate(id);
  }
}
