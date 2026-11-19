import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Adds `hidden_from_library` on the media collection.
 *
 * Set when an image is uploaded inline from the article editor (drag-drop
 * onto the body, or the "Insert from device" toolbar button). The file still
 * lives in R2 and is reachable by URL — the flag just excludes it from the
 * Media Library grid so one-off body images don't swamp the gallery view.
 *
 * Existing rows default to `false` (visible in the library), preserving the
 * current behavior. Media is not versioned, so no `_media_v` mirror is
 * needed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "hidden_from_library" boolean DEFAULT false;
    UPDATE "media" SET "hidden_from_library" = false WHERE "hidden_from_library" IS NULL;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" DROP COLUMN IF EXISTS "hidden_from_library";
  `);
}
