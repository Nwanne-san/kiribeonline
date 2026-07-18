#!/usr/bin/env node
/**
 * R2 connectivity check. Verifies the bucket credentials and public URL are
 * wired correctly end-to-end BEFORE you rely on admin uploads.
 *
 * Usage:  npm run r2:check
 *
 * Steps: env presence → PutObject → GetObject (private) → fetch public URL →
 * DeleteObject cleanup. Loads .env.local for any vars not already in the env.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(__dirname, "../.env.local");

function loadEnvLocal() {
  if (!existsSync(envLocalPath)) return;
  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const ok = (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => console.log(`\x1b[31m✗\x1b[0m ${m}`);
const info = (m) => console.log(`  ${m}`);

async function main() {
  loadEnvLocal();

  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
    R2_S3_ENDPOINT,
  } = process.env;

  // 1) Env presence — either an explicit endpoint or an account id is required.
  const missing = [];
  if (!R2_ACCOUNT_ID && !R2_S3_ENDPOINT) missing.push("R2_ACCOUNT_ID (or R2_S3_ENDPOINT)");
  if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!R2_BUCKET_NAME) missing.push("R2_BUCKET_NAME");
  if (missing.length) {
    bad(`Missing env: ${missing.join(", ")}`);
    info("Fill these in .env.local, then re-run. See docs/DEVELOPER.md → Cloudflare R2.");
    process.exit(1);
  }
  ok("Core R2 env present");
  if (!R2_PUBLIC_URL) {
    info("R2_PUBLIC_URL is empty — public-URL step will be skipped (uploads still work, but the site can't render them).");
  }

  const endpoint =
    R2_S3_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  info(`Using S3 endpoint: ${endpoint}`);
  const client = new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const key = `_healthcheck/r2-check-${Date.now()}.txt`;
  const bodyText = "kiribe r2 connectivity check";

  // 2) Put
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: bodyText,
        ContentType: "text/plain",
      })
    );
    ok(`PutObject → s3://${R2_BUCKET_NAME}/${key}`);
  } catch (err) {
    const msg = String(err?.message ?? err);
    const tlsFailure =
      msg.includes("EPROTO") ||
      msg.includes("handshake") ||
      err?.code === "EPROTO";
    bad(`PutObject failed: ${err?.name ?? err}${err?.message ? ` — ${err.message}` : ""}`);
    if (tlsFailure) {
      info("TLS handshake was refused — the S3 endpoint host is wrong (Cloudflare serves no cert for it).");
      info("Fix: open your bucket → Settings → S3 API, copy the exact endpoint shown there,");
      info("and set it as R2_S3_ENDPOINT in .env.local (or correct R2_ACCOUNT_ID to that subdomain).");
      info("If the endpoint contains a jurisdiction segment like `.eu.`, you MUST use R2_S3_ENDPOINT.");
    } else {
      info("Check the API token has Object Read & Write on this bucket, and that R2_BUCKET_NAME is correct.");
    }
    process.exit(1);
  }

  // 3) Get (private, via S3 API)
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
    );
    const text = await res.Body.transformToString();
    if (text === bodyText) ok("GetObject round-trip verified");
    else bad("GetObject returned unexpected content");
  } catch (err) {
    bad(`GetObject failed: ${err?.name ?? err}`);
  }

  // 4) Public URL fetch
  if (R2_PUBLIC_URL) {
    const base = R2_PUBLIC_URL.replace(/\/$/, "");
    const publicUrl = `${base}/${key}`;
    try {
      const res = await fetch(publicUrl);
      if (res.ok) {
        ok(`Public URL reachable: ${base}/…`);
      } else {
        bad(`Public URL returned HTTP ${res.status}`);
        info("Enable public access on the bucket (r2.dev) or attach a custom domain, and confirm R2_PUBLIC_URL matches it exactly.");
      }
    } catch (err) {
      bad(`Public URL fetch failed: ${err?.name ?? err}`);
      info(`Confirm R2_PUBLIC_URL is a full origin (https://…) and DNS resolves. Tried: ${publicUrl}`);
    }
  }

  // 5) Cleanup
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
    );
    ok("Cleanup (DeleteObject) done");
  } catch (err) {
    info(`Cleanup skipped: ${err?.name ?? err} (safe to ignore; the object is under _healthcheck/).`);
  }

  console.log("\nR2 check complete.");
}

main().catch((err) => {
  bad(`Unexpected error: ${err?.message ?? err}`);
  process.exit(1);
});
