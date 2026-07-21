import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "reset_token_hash" varchar;
  ALTER TABLE "users" ADD COLUMN "reset_token_expires_at" timestamp(3) with time zone;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "reset_token_hash";
  ALTER TABLE "users" DROP COLUMN "reset_token_expires_at";`);
}
