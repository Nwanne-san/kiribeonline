import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { migrations } from "./migrations";
import { lexicalEditor, UploadFeature } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";
import { MAX_UPLOAD_BYTES } from "@/constants";

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

// Fail loud in production if media storage is misconfigured. Falling back to
// local disk on a serverless host silently loses every upload after the next
// cold start, so refuse to boot instead. Dev/preview keep the local-disk path.
// Skipped during `next build` (env is injected at deploy/runtime, not build) so
// a build box without R2 secrets can still compile — the guard fires on boot.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
if (
  process.env.NODE_ENV === "production" &&
  !isBuildPhase &&
  (!useR2 || !process.env.R2_PUBLIC_URL)
) {
  throw new Error(
    "Media storage is misconfigured for production: set R2_BUCKET_NAME, " +
      "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID and R2_PUBLIC_URL. " +
      "Refusing to start on local-disk storage."
  );
}

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
  // Bound the Payload REST/local upload surface too, so the size cap holds even
  // for callers that bypass the custom admin route.
  upload: {
    limits: { fileSize: MAX_UPLOAD_BYTES },
  },
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
            // Prefer an explicit endpoint (paste the exact one from the bucket's
            // S3 API panel — handles jurisdiction endpoints like `<id>.eu.…`).
            // Falls back to the standard endpoint built from the account id.
            endpoint:
              process.env.R2_S3_ENDPOINT ||
              `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            region: "auto",
            forcePathStyle: true,
          },
        }),
      ]
    : [],
});
