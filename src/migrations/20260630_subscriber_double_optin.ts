import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Adds double opt-in fields to the subscribers table.
 *
 * - confirmed (boolean) — true once the subscriber clicks the confirmation link.
 * - confirmation_token (varchar) — random token included in the confirmation URL.
 * - confirmed_at (timestamptz) — when they confirmed.
 *
 * Backfills existing rows as confirmed=true so historic subscribers aren't
 * locked out (they predate double opt-in).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "confirmed" boolean DEFAULT false;
    ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "confirmation_token" varchar;
    ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp(3) with time zone;
    UPDATE "subscribers" SET "confirmed" = true WHERE "confirmed" IS NULL OR "confirmed" = false;
    CREATE INDEX IF NOT EXISTS "subscribers_confirmation_token_idx" ON "subscribers" ("confirmation_token");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "subscribers_confirmation_token_idx";
    ALTER TABLE "subscribers" DROP COLUMN IF EXISTS "confirmed_at";
    ALTER TABLE "subscribers" DROP COLUMN IF EXISTS "confirmation_token";
    ALTER TABLE "subscribers" DROP COLUMN IF EXISTS "confirmed";
  `);
}
