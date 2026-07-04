import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { migrations } from "./migrations";
import { lexicalEditor, UploadFeature } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";

import {
  Articles,
  AuditLogs,
  Categories,
  ContactMessages,
  Creators,
  Media,
  Reels,
  Subscribers,
  Tags,
  Users,
} from "./payload/collections";
import { SiteSettings } from "./payload/globals/SiteSettings";
import { Homepage } from "./payload/globals/Homepage";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const useR2 =
  Boolean(process.env.R2_BUCKET_NAME) &&
  Boolean(process.env.R2_ACCESS_KEY_ID) &&
  Boolean(process.env.R2_SECRET_ACCESS_KEY) &&
  Boolean(process.env.R2_ACCOUNT_ID);

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  routes: {
    admin: "/payload-studio",
  },
  admin: {
    user: Users.slug,
    disable: process.env.DISABLE_PAYLOAD_STUDIO === "true",
    importMap: {
      baseDir: path.resolve(dirname, "payload"),
    },
    meta: {
      titleSuffix: "— Kiribe Admin",
    },
  },
  collections: [Users, Articles, Categories, Tags, Media, Creators, Reels, AuditLogs, Subscribers, ContactMessages],
  globals: [SiteSettings, Homepage],
  // The app uses Payload REST + the local API only. Disabling GraphQL removes an
  // unused, publicly reachable query surface (and its playground).
  graphQL: {
    disable: true,
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, UploadFeature()],
  }),
  secret: process.env.PAYLOAD_SECRET || "dev-only-change-me",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    // Disable auto-push: schema changes must go through explicit migrations
    // (`npm run migrate:create` + `npm run migrate`). Editors are unaffected —
    // this only governs DEVELOPER schema changes. See CLAUDE.md for the flow.
    push: false,
    prodMigrations: migrations,
  }),
  sharp,
  plugins: useR2
    ? [
        s3Storage({
          collections: {
            media: true,
          },
          bucket: process.env.R2_BUCKET_NAME || "",
          config: {
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
            },
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            region: "auto",
            forcePathStyle: true,
          },
        }),
      ]
    : [],
});
