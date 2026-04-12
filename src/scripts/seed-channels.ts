/**
 * Script para poblar la base de datos con los canales argentinos iniciales.
 * Uso: npx ts-node src/scripts/seed-channels.ts
 *
 * Canales de streaming de Argentina más importantes.
 * Para obtener el channel ID de cada uno, buscalos con:
 *   GET /api/channels/resolve/@HANDLE
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// PASO 1: Completá los channel IDs de abajo.
//
// Para encontrar el ID de un canal de YouTube:
//   Opción A: Ir a youtube.com/@handle → click "Compartir" → "Copiar el ID del canal"
//   Opción B: Con el servidor corriendo: GET /api/channels/resolve/@handle
//   Opción C: https://commentpicker.com/youtube-channel-id.php
// ─────────────────────────────────────────────
const CHANNELS = [
  // Formato: { youtubeChannelId: 'UCxxxxxxxxxx', name: 'Nombre del canal' }
  // ⚠️  Reemplazá los IDs con los reales antes de correr este script

  // Canales de streaming/entretenimiento Argentina
  { youtubeChannelId: 'UCTHaNTsP7hsVgBxARZTuajw', name: 'Luzu TV' },
  { youtubeChannelId: 'UCWXRkZWaGqz-LCIHfCFR40w', name: 'Olga' },
  { youtubeChannelId: 'UC6pJGaMdx5Ter_8zYbLoRgA', name: 'Blender' },
  { youtubeChannelId: 'UCvCTWHCbBC0b9UIeLeNs8ug', name: 'Vorterix' },
  { youtubeChannelId: 'UCWSfXECGo1qK_H7SXRaUSMg', name: 'Gelatina' },
  { youtubeChannelId: 'UC-40U87JsevMIMn7PMw4jPw', name: 'Neura' },
  { youtubeChannelId: 'UCBtnjnfa1I_Q18f_fSTVefQ', name: 'LatFem' },
];

async function main() {
  console.log('🌱 Seeding canales argentinos...\n');

  let added = 0;
  let skipped = 0;

  for (const ch of CHANNELS) {
    if (ch.youtubeChannelId === 'REEMPLAZAR') {
      console.log(`⚠️  Saltando "${ch.name}" — completá el youtubeChannelId primero`);
      skipped++;
      continue;
    }

    await prisma.channel.upsert({
      where: { youtubeChannelId: ch.youtubeChannelId },
      update: { active: true, name: ch.name },
      create: { youtubeChannelId: ch.youtubeChannelId, name: ch.name },
    });

    console.log(`✅ ${ch.name} (${ch.youtubeChannelId})`);
    added++;
  }

  console.log(`\n🎉 Listo: ${added} canales agregados, ${skipped} saltados`);
  console.log('\nPróximo paso: POST /api/metrics/collect para recolectar las métricas ahora mismo');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
