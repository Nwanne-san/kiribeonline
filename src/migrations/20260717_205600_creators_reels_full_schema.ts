import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Complete the `creators` and `reels` schema. These collections were added to
 * the config but only ever synced via dev `push`, which left the live DB with
 * bare tables (no FKs/indexes) and the `homepage` global missing its
 * spotlight/reels/archive columns — so `payload.findGlobal('homepage')` threw
 * and silently fell back to defaults, and creator/reel admin writes failed.
 *
 * Derived from the config's migration snapshot (authoritative). Fully idempotent
 * (IF NOT EXISTS + guarded constraint blocks): on the drifted dev DB it fills
 * only the missing pieces; on a fresh DB it creates everything. Ordered before
 * `20260717_210000_locked_docs_creators_reels` so the locking FKs that
 * reference these tables resolve on a clean database.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Enum types
    DO $$ BEGIN CREATE TYPE "public"."enum_creators_achievements_icon" AS ENUM('award', 'star', 'trending', 'medal'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_reels_platform" AS ENUM('instagram', 'tiktok', 'youtube'); EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Tables
    CREATE TABLE IF NOT EXISTS "creators" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "role" varchar NOT NULL,
      "bio" varchar,
      "portrait_id" integer NOT NULL,
      "quote" varchar,
      "featured_on_homepage" boolean DEFAULT false,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "creators_achievements" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "value" varchar NOT NULL,
      "icon" "public"."enum_creators_achievements_icon" DEFAULT 'award'
    );
    CREATE TABLE IF NOT EXISTS "creators_badges" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "color" varchar DEFAULT '#6B1D2A'
    );
    CREATE TABLE IF NOT EXISTS "reels" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "label" varchar NOT NULL,
      "platform" "public"."enum_reels_platform" NOT NULL,
      "thumbnail_id" integer NOT NULL,
      "external_url" varchar NOT NULL,
      "published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "homepage_featured_creators" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "creator_id" integer NOT NULL,
      "sort_order" numeric DEFAULT 0
    );

    -- Homepage global columns
    ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "spotlight_creator_id" integer;
    ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "reels_enabled" boolean DEFAULT true;
    ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "archive_cta_enabled" boolean DEFAULT true;
    ALTER TABLE "homepage_rels" ADD COLUMN IF NOT EXISTS "reels_id" integer;

    -- Foreign keys
    DO $$ BEGIN ALTER TABLE "creators_badges" ADD CONSTRAINT "creators_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "creators_achievements" ADD CONSTRAINT "creators_achievements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "creators" ADD CONSTRAINT "creators_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "reels" ADD CONSTRAINT "reels_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "homepage_featured_creators" ADD CONSTRAINT "homepage_featured_creators_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "homepage_featured_creators" ADD CONSTRAINT "homepage_featured_creators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "homepage" ADD CONSTRAINT "homepage_spotlight_creator_id_creators_id_fk" FOREIGN KEY ("spotlight_creator_id") REFERENCES "public"."creators"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_reels_fk" FOREIGN KEY ("reels_id") REFERENCES "public"."reels"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Indexes
    CREATE INDEX IF NOT EXISTS "creators_badges_order_idx" ON "creators_badges" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "creators_badges_parent_id_idx" ON "creators_badges" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "creators_achievements_order_idx" ON "creators_achievements" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "creators_achievements_parent_id_idx" ON "creators_achievements" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "creators_slug_idx" ON "creators" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "creators_portrait_idx" ON "creators" USING btree ("portrait_id");
    CREATE INDEX IF NOT EXISTS "creators_updated_at_idx" ON "creators" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "creators_created_at_idx" ON "creators" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "reels_slug_idx" ON "reels" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "reels_thumbnail_idx" ON "reels" USING btree ("thumbnail_id");
    CREATE INDEX IF NOT EXISTS "reels_updated_at_idx" ON "reels" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "reels_created_at_idx" ON "reels" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "homepage_featured_creators_order_idx" ON "homepage_featured_creators" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "homepage_featured_creators_parent_id_idx" ON "homepage_featured_creators" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "homepage_featured_creators_creator_idx" ON "homepage_featured_creators" USING btree ("creator_id");
    CREATE INDEX IF NOT EXISTS "homepage_spotlight_creator_idx" ON "homepage" USING btree ("spotlight_creator_id");
    CREATE INDEX IF NOT EXISTS "homepage_rels_reels_id_idx" ON "homepage_rels" USING btree ("reels_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "homepage" DROP CONSTRAINT IF EXISTS "homepage_spotlight_creator_id_creators_id_fk";
    ALTER TABLE "homepage_rels" DROP CONSTRAINT IF EXISTS "homepage_rels_reels_fk";
    ALTER TABLE "homepage" DROP COLUMN IF EXISTS "spotlight_creator_id";
    ALTER TABLE "homepage" DROP COLUMN IF EXISTS "reels_enabled";
    ALTER TABLE "homepage" DROP COLUMN IF EXISTS "archive_cta_enabled";
    ALTER TABLE "homepage_rels" DROP COLUMN IF EXISTS "reels_id";
    DROP TABLE IF EXISTS "homepage_featured_creators" CASCADE;
    DROP TABLE IF EXISTS "creators_achievements" CASCADE;
    DROP TABLE IF EXISTS "creators_badges" CASCADE;
    DROP TABLE IF EXISTS "creators" CASCADE;
    DROP TABLE IF EXISTS "reels" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_creators_achievements_icon";
    DROP TYPE IF EXISTS "public"."enum_reels_platform";
  `)
}
