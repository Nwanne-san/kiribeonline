#!/usr/bin/env node
/**
 * Bootstrap first admin user. Usage:
 * npm run create-admin -- --email you@example.com --password 'secret'
 *
 * Loads .env.local when DATABASE_URL / PAYLOAD_SECRET are not already set.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

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
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  loadEnvLocal();
}

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    name: { type: "string", default: "Admin" },
  },
});

const email = values.email;
const password = values.password;
const name = values.name ?? "Admin";

if (!email || !password) {
  console.error("Usage: npm run create-admin -- --email you@example.com --password 'secret'");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

// Skip drizzle push (migrations own schema in this project)
process.env.PAYLOAD_MIGRATING = "true";

const { getPayload } = await import("payload");
const config = (await import("../src/payload.config.ts")).default;

const payload = await getPayload({ config });

const existing = await payload.find({
  collection: "users",
  where: { email: { equals: email } },
  limit: 1,
  overrideAccess: true,
});

if (existing.docs.length) {
  console.log(`User already exists: ${email}`);
  process.exit(0);
}

await payload.create({
  collection: "users",
  data: { email, password, name },
  overrideAccess: true,
});

console.log(`Created admin user: ${email}`);
process.exit(0);
