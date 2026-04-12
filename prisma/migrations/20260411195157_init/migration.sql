-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "youtube_channel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,
    "description" TEXT,
    "country" TEXT,
    "thumbnail_url" TEXT,
    "published_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_snapshots" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "subscribers" BIGINT NOT NULL,
    "total_views" BIGINT NOT NULL,
    "video_count" INTEGER NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_rankings" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'daily',
    "channel_id" TEXT NOT NULL,
    "subscriber_rank" INTEGER,
    "views_growth_rank" INTEGER,
    "subscribers" BIGINT NOT NULL,
    "total_views" BIGINT NOT NULL,
    "video_count" INTEGER NOT NULL,
    "subscriber_delta" BIGINT,
    "views_delta" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_youtube_channel_id_key" ON "channels"("youtube_channel_id");

-- CreateIndex
CREATE INDEX "channel_snapshots_date_idx" ON "channel_snapshots"("date");

-- CreateIndex
CREATE UNIQUE INDEX "channel_snapshots_channel_id_date_key" ON "channel_snapshots"("channel_id", "date");

-- CreateIndex
CREATE INDEX "daily_rankings_date_period_idx" ON "daily_rankings"("date", "period");

-- CreateIndex
CREATE UNIQUE INDEX "daily_rankings_channel_id_date_period_key" ON "daily_rankings"("channel_id", "date", "period");

-- AddForeignKey
ALTER TABLE "channel_snapshots" ADD CONSTRAINT "channel_snapshots_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_rankings" ADD CONSTRAINT "daily_rankings_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
