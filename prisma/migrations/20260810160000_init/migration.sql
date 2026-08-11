CREATE TYPE "ProjectLocale" AS ENUM ('ru', 'uk', 'en');

CREATE TABLE "love_projects" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(48) NOT NULL,
  "edit_token_hash" CHAR(64) NOT NULL,
  "locale" "ProjectLocale" NOT NULL DEFAULT 'ru',
  "title" VARCHAR(80) NOT NULL,
  "sender_name" VARCHAR(60) NOT NULL,
  "recipient_name" VARCHAR(60) NOT NULL,
  "intro_text" VARCHAR(280) NOT NULL,
  "button_text" VARCHAR(40) NOT NULL,
  "shake_hint" VARCHAR(80) NOT NULL,
  "final_message" VARCHAR(600) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "love_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "love_letters" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "title" VARCHAR(80),
  "message" VARCHAR(1200) NOT NULL,
  "order" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "love_letters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "publish_events" (
  "id" BIGSERIAL NOT NULL,
  "ip_hash" CHAR(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "publish_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "love_projects_slug_key" ON "love_projects"("slug");
CREATE INDEX "love_projects_expires_at_idx" ON "love_projects"("expires_at");
CREATE UNIQUE INDEX "love_letters_project_id_order_key" ON "love_letters"("project_id", "order");
CREATE INDEX "love_letters_project_id_enabled_order_idx" ON "love_letters"("project_id", "enabled", "order");
CREATE INDEX "publish_events_ip_hash_created_at_idx" ON "publish_events"("ip_hash", "created_at" DESC);
ALTER TABLE "love_letters" ADD CONSTRAINT "love_letters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "love_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
