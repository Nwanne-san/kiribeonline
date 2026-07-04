import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "brand_color" varchar DEFAULT '#6B1D2A';
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "show_in_nav" boolean DEFAULT true;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_system" boolean DEFAULT false;
    ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "brand_color" varchar DEFAULT '#C9A227';
    ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "is_system" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "brand_color";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "show_in_nav";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "is_system";
    ALTER TABLE "tags" DROP COLUMN IF EXISTS "brand_color";
    ALTER TABLE "tags" DROP COLUMN IF EXISTS "is_system";
  `)
}
