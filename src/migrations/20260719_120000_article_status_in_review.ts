import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add the `in_review` value to the article status enums (main + version table),
 * introducing the editorial-workflow submission spine (contributor/writer →
 * editor). Idempotent: `ADD VALUE IF NOT EXISTS` skips no-op on any DB whose
 * enum already has the value.
 *
 * We also add `scheduled` and `archived` here — the original schema migration
 * (20260627_113318) only enumerated `draft` and `published`, but the Payload
 * collection has listed all four for months. Any DB that ran `payload push`
 * along the way already has them; anything else has drift that a write would
 * fail on. Adding the values idempotently heals both worlds without breaking
 * either.
 *
 * Postgres does not support removing enum values in a transaction, so the
 * `down` migration only records intent — it will not actually shrink the enum.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_articles_status" ADD VALUE IF NOT EXISTS 'scheduled';
    ALTER TYPE "public"."enum_articles_status" ADD VALUE IF NOT EXISTS 'archived';
    ALTER TYPE "public"."enum_articles_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum__articles_v_version_status" ADD VALUE IF NOT EXISTS 'scheduled';
    ALTER TYPE "public"."enum__articles_v_version_status" ADD VALUE IF NOT EXISTS 'archived';
    ALTER TYPE "public"."enum__articles_v_version_status" ADD VALUE IF NOT EXISTS 'in_review';
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Postgres does not support removing enum values without rebuilding the type
  // and rewriting every dependent column. Rolling this migration back means
  // the enum values stay in place; any article that was set to `in_review`
  // must be manually reset to a value present in the shrunken schema before
  // the type could be rebuilt. Leaving as a no-op — the forward migration is
  // safe to re-run, so a rollback + reapply cycle is non-destructive.
}
