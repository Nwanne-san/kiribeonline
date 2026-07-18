import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// NOTE: `migrate:create` also emitted `subscribers` (confirmed/confirmation_token/
// confirmed_at) diffs because the hand-written 20260630_subscriber_double_optin
// migration shipped without a Drizzle snapshot, so the snapshot chain never
// recorded those columns. Those lines were removed here — they are owned by that
// migration and re-adding them would fail where it has already run. This
// migration's companion .json snapshot DOES capture the full current state, which
// heals the drift so future auto-migrations no longer re-emit the subscriber diff.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'writer', 'contributor');
  CREATE TYPE "public"."enum_users_status" AS ENUM('active', 'pending', 'suspended');
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'contributor' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "status" "enum_users_status" DEFAULT 'active' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "avatar_id" integer;
  -- Every user that predates RBAC was a full admin; promote them so the live
  -- admin is not demoted to the 'contributor' column default. New users created
  -- after this migration get their role explicitly (invite) or via Payload's
  -- field default.
  UPDATE "users" SET "role" = 'admin';
  ALTER TABLE "articles" ADD COLUMN "author_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN "version_author_id" integer;
  ALTER TABLE "contact_messages" ADD COLUMN "read" boolean DEFAULT false;
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_id");
  CREATE INDEX "_articles_v_version_version_author_idx" ON "_articles_v" USING btree ("version_author_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "users" DROP CONSTRAINT "users_avatar_id_media_id_fk";
  ALTER TABLE "articles" DROP CONSTRAINT "articles_author_id_users_id_fk";
  ALTER TABLE "_articles_v" DROP CONSTRAINT "_articles_v_version_author_id_users_id_fk";
  DROP INDEX "users_avatar_idx";
  DROP INDEX "articles_author_idx";
  DROP INDEX "_articles_v_version_version_author_idx";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "users" DROP COLUMN "status";
  ALTER TABLE "users" DROP COLUMN "avatar_id";
  ALTER TABLE "articles" DROP COLUMN "author_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_author_id";
  ALTER TABLE "contact_messages" DROP COLUMN "read";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_status";`)
}
