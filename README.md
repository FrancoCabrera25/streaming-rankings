# Streaming Rankings Argentina — Backend

Backend en NestJS que recopila métricas públicas de canales de YouTube y genera rankings diarios, semanales y mensuales.

---

## Stack

- **NestJS** — framework backend
- **Prisma** — ORM para acceder a la base de datos
- **Neon** — PostgreSQL serverless (cloud)
- **YouTube Data API v3** — fuente de métricas públicas
- **@nestjs/schedule** — cron job diario a las 23:00 hs ART

---

## Configuración paso a paso

### 1. Clonar e instalar dependencias

```bash
npm install
```

---

### 2. Configurar YouTube Data API v3 en Google Cloud

**A. Habilitar la API:**
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Seleccionar tu proyecto (o crear uno nuevo)
3. Menú → **APIs & Services** → **Library**
4. Buscar **"YouTube Data API v3"** → Click → **Enable**

**B. Crear una API Key:**
1. Ir a **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **API Key**
3. Copiar la key generada (empieza con `AIzaSy...`)
4. Opcional pero recomendado: click en la key → **Restrict key** → seleccionar **YouTube Data API v3** como API permitida

**C. Cuota gratuita:**
- La YouTube Data API v3 tiene un límite de **10,000 unidades por día** en el tier gratuito
- `channels.list` cuesta **1 unidad por request** con hasta 50 canales
- Para 50 canales = 1 request/día → consume prácticamente nada del cupo

---

### 3. Configurar Neon (PostgreSQL serverless)

1. Ir a [console.neon.tech](https://console.neon.tech)
2. Crear un nuevo proyecto (ej: `streaming-rankings`)
3. En el dashboard del proyecto → **Connection Details**
4. Seleccionar el driver **Prisma** en el dropdown
5. Copiar la `DATABASE_URL` (formato: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)

---

### 4. Crear el archivo .env

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
YOUTUBE_API_KEY=AIzaSy...tu-api-key...
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/streaming_rankings?sslmode=require
PORT=3000
```

---

### 5. Crear las tablas en Neon

```bash
# Genera el Prisma Client
npm run prisma:generate

# Crea las tablas en Neon
npm run prisma:push
```

Podés verificar las tablas con:
```bash
npm run prisma:studio
```

---

### 6. Agregar los canales a trackear

**Opción A — Por handle (más fácil):**
```bash
# Con el servidor corriendo en otra terminal:
curl -X POST http://localhost:3000/api/channels/by-handle \
  -H "Content-Type: application/json" \
  -d '{"handle": "@luzutv"}'
```

**Opción B — Por Channel ID:**
```bash
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -d '{"youtubeChannelId": "UCxxxxxxxxxx"}'
```

**Cómo encontrar el Channel ID de un canal:**
- Ir a `youtube.com/@handle` → click en "Compartir" → "Copiar el ID del canal"
- O visitar: https://commentpicker.com/youtube-channel-id.php

**Canales sugeridos para empezar:**
```
@luzutv
@somosolga
@BlenderMedios
@Vorterix
@Gelatina
@NeuraMedia
```

---

### 7. Correr el servidor

```bash
# Desarrollo (con hot reload)
npm run start:dev

# Producción
npm run build && npm run start:prod
```

---

### 8. Primera recolección de datos

Sin esperar el cron, podés recolectar ahora:

```bash
# Recolectar métricas
curl -X POST http://localhost:3000/api/metrics/collect

# Calcular rankings
curl -X POST http://localhost:3000/api/rankings/compute
```

---

## Endpoints disponibles

### Canales
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/channels` | Lista todos los canales activos |
| `POST` | `/api/channels` | Agrega canal por Channel ID |
| `POST` | `/api/channels/by-handle` | Agrega canal por @handle |
| `GET` | `/api/channels/resolve/:handle` | Resuelve @handle → agrega el canal |
| `DELETE` | `/api/channels/:id` | Desactiva un canal |

### Rankings
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/rankings?period=daily` | Ranking del día actual |
| `GET` | `/api/rankings?period=weekly` | Ranking de los últimos 7 días |
| `GET` | `/api/rankings?period=monthly` | Ranking de los últimos 30 días |
| `GET` | `/api/rankings/history/:channelId?days=30` | Historial de un canal |
| `POST` | `/api/rankings/compute` | Recalcula rankings ahora |

### Métricas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/metrics/collect` | Recolecta datos ahora |

---

## Ejemplo de respuesta — Ranking diario

```json
{
  "period": "daily",
  "date": "2025-01-15",
  "rankings": [
    {
      "rank": 1,
      "channel": {
        "id": "cld_xxx",
        "name": "Luzu TV",
        "handle": "@luzutv",
        "thumbnailUrl": "https://yt3.ggpht.com/..."
      },
      "subscribers": "1250000",
      "totalViews": "450000000",
      "videoCount": 1823,
      "growth": {
        "subscribers": "2500",
        "views": "850000"
      }
    }
  ]
}
```

---

## Estructura del proyecto

```
src/
├── app.module.ts
├── main.ts
├── prisma/
│   ├── prisma.service.ts      # Cliente de Neon/PostgreSQL
│   └── prisma.module.ts
├── youtube/
│   ├── youtube.service.ts     # Integración YouTube Data API v3
│   ├── youtube.types.ts
│   └── youtube.module.ts
├── channels/
│   ├── channels.service.ts    # Gestión de canales trackeados
│   ├── channels.controller.ts
│   └── channels.module.ts
├── metrics/
│   ├── metrics.service.ts     # Recolección diaria de snapshots
│   ├── metrics.controller.ts
│   └── metrics.module.ts
├── rankings/
│   ├── rankings.service.ts    # Cálculo de rankings por período
│   ├── rankings.controller.ts
│   └── rankings.module.ts
├── scheduler/
│   ├── scheduler.service.ts   # Cron 23:00 hs ART
│   └── scheduler.module.ts
└── scripts/
    └── seed-channels.ts       # Seed inicial de canales

prisma/
└── schema.prisma              # Modelos: channels, channel_snapshots, daily_rankings
```

---

## Cómo funciona el ranking

**Snapshot diario:** cada día a las 23:00 hs (cron) se guarda en `channel_snapshots` los valores actuales de suscriptores, vistas totales y cantidad de videos.

**Ranking diario:** compara el snapshot de hoy vs ayer. Se rankea por:
1. Total de suscriptores (quién tiene más)
2. Crecimiento de suscriptores en el día

**Ranking semanal:** delta acumulado de los últimos 7 días.

**Ranking mensual:** delta acumulado de los últimos 30 días.

Los rankings semanal y mensual se van construyendo solos a medida que se acumulan días de datos. El primer ranking mensual real va a estar disponible después de 30 días de ejecución.

---

## Próximos pasos sugeridos

- [ ] Agregar autenticación a los endpoints de admin (POST, DELETE)
- [ ] Endpoint de comparación entre dos canales
- [ ] Métricas de videos individuales (más vistas del día)
- [ ] Integrar Twitch o Instagram
- [ ] Dashboard frontend en Next.js
- [ ] Alertas por email/webhook cuando un canal crece X%
