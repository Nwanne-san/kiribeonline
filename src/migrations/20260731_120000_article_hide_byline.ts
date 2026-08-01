import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Adds the per-article public byline opt-out.
 *
 * `hide_byline` only suppresses the writer's name on the public site — the
 * `author_id` relationship is untouched, so the admin module, author stats, and
 * version history keep attributing the piece to the real writer. Public
 * surfaces render “Kiribé Editor” instead (never “Anonymous”).
 *
 * Articles are versioned, so the column is mirrored on `_articles_v` with the
 * `version_` prefix Payload expects. Existing rows default to `false`
 * (byline shown), preserving today's behaviour.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "hide_byline" boolean DEFAULT false;
    ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_hide_byline" boolean DEFAULT false;
    UPDATE "articles" SET "hide_byline" = false WHERE "hide_byline" IS NULL;
    UPDATE "_articles_v" SET "version_hide_byline" = false WHERE "version_hide_byline" IS NULL;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_hide_byline";
    ALTER TABLE "articles" DROP COLUMN IF EXISTS "hide_byline";
  `);
}
