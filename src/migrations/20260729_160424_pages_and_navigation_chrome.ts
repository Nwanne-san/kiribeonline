import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Adds the `pages` collection and the SiteSettings `navigation` group
 * (header links + footer columns).
 *
 * Hand-trimmed from `payload migrate:create`. The generator also emitted
 * `users.reset_token_*` and `media.blur_data_url` as new columns — those were
 * already shipped by the hand-written migrations `20260721_090000` and
 * `20260718_090000`, which carry no drizzle snapshot for the generator to diff
 * against. Re-adding them here would fail with "column already exists", so
 * they're removed. The accompanying `.json` snapshot records the true schema,
 * so future `migrate:create` runs won't repeat the drift.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"excerpt" varchar,
  	"body" jsonb,
  	"status" "enum_pages_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"show_in_footer" boolean DEFAULT false,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "site_settings_navigation_header_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"visible" boolean DEFAULT true
  );

  CREATE TABLE "site_settings_navigation_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"visible" boolean DEFAULT true
  );

  CREATE TABLE "site_settings_navigation_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_navigation_header_links" ADD CONSTRAINT "site_settings_navigation_header_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_navigation_footer_columns_links" ADD CONSTRAINT "site_settings_navigation_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_navigation_footer_columns" ADD CONSTRAINT "site_settings_navigation_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "site_settings_navigation_header_links_order_idx" ON "site_settings_navigation_header_links" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_header_links_parent_id_idx" ON "site_settings_navigation_header_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_navigation_footer_columns_links_order_idx" ON "site_settings_navigation_footer_columns_links" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_footer_columns_links_parent_id_idx" ON "site_settings_navigation_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_navigation_footer_columns_order_idx" ON "site_settings_navigation_footer_columns" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_footer_columns_parent_id_idx" ON "site_settings_navigation_footer_columns" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_pages_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_pages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "pages_id";
  DROP TABLE IF EXISTS "site_settings_navigation_footer_columns_links" CASCADE;
  DROP TABLE IF EXISTS "site_settings_navigation_footer_columns" CASCADE;
  DROP TABLE IF EXISTS "site_settings_navigation_header_links" CASCADE;
  DROP TABLE IF EXISTS "pages" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_pages_status";`);
}
