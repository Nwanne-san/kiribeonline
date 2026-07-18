import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Backfill the two relationship columns the document-locking join table is
 * missing. The `creators` and `reels` collections were added after the initial
 * schema but their `payload_locked_documents_rels` columns were never migrated,
 * so any admin update triggered `column "creators_id" does not exist`.
 *
 * Additive + idempotent — matches the FK/index convention of the existing
 * columns on this table.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "creators_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "reels_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_creators_fk" FOREIGN KEY ("creators_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reels_fk" FOREIGN KEY ("reels_id") REFERENCES "public"."reels"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_creators_id_idx" ON "payload_locked_documents_rels" USING btree ("creators_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reels_id_idx" ON "payload_locked_documents_rels" USING btree ("reels_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_creators_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_reels_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_creators_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_reels_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "creators_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reels_id";
  `)
}
