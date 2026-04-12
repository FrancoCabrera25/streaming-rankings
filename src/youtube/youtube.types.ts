// Datos que devuelve la YouTube Data API v3
// endpoint: GET /channels?part=statistics,snippet&id=CHANNEL_ID
export interface YoutubeChannelStats {
  youtubeChannelId: string;
  name: string;
  handle?: string;         // Ej: "@luzutv" (customUrl en la API)
  description?: string;
  country?: string;
  thumbnailUrl?: string;
  publishedAt?: Date;
  subscribers: bigint;     // subscriberCount (puede ser 0 si está oculto)
  totalViews: bigint;      // viewCount (vistas totales acumuladas)
  videoCount: number;      // videoCount (videos públicos)
  hiddenSubscriberCount: boolean; // true = el canal ocultó sus suscriptores
}

// Datos de un video individual
export interface YoutubeVideo {
  youtubeVideoId: string;
  youtubeChannelId: string;
  title: string;
  description?: string;
  publishedAt?: Date;
}

// Estadísticas actuales de un video (incluyendo vivo)
export interface YoutubeVideoStats {
  youtubeVideoId: string;
  views: bigint;
  likes?: bigint;
  comments?: bigint;
  concurrentViewers?: bigint; // Solo si está en vivo
}
