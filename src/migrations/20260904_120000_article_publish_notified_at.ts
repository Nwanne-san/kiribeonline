import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Adds the atomic-claim column used to dedupe subscriber notifications when an
 * article transitions to `published`. Both the cron publisher and the
 * on-demand promotion path (article-detail request) issue a conditional UPDATE
 * that only succeeds when `publish_notified_at IS NULL`; whichever path wins
 * sends the email once, the other becomes a no-op.
 *
 * Articles are versioned, so the column is mirrored on `_articles_v` with the
 * `version_` prefix Payload expects. Existing published articles are backfilled
 * with `updated_at` so we don't spam subscribers with historical stories on
 * the first cron run after deploy.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "publish_notified_at" timestamp(3) with time zone;
    ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_publish_notified_at" timestamp(3) with time zone;
    UPDATE "articles"
      SET "publish_notified_at" = COALESCE("published_at", "updated_at")
      WHERE "status" = 'published' AND "publish_notified_at" IS NULL;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_publish_notified_at";
    ALTER TABLE "articles" DROP COLUMN IF EXISTS "publish_notified_at";
  `);
}
