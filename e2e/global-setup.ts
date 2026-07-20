import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Playwright global setup:
 *   1. Load `.env.local` for local runs so DATABASE_URL / PAYLOAD_SECRET are
 *      visible to migrate + seed (CI provides these already via job env).
 *   2. Run Payload migrations against the current DATABASE_URL.
 *   3. Run the smoke seed script.
 *
 * Skipping DB work entirely is allowed via `PLAYWRIGHT_SKIP_SEED=1` — useful
 * when a developer is only running config/spec-collection checks.
 */
export default async function globalSetup() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(__dirname, "..");
  const envLocalPath = resolve(repoRoot, ".env.local");

  if (existsSync(envLocalPath)) {
    for (const line of readFileSync(envLocalPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }

  if (process.env.PLAYWRIGHT_SKIP_SEED === "1") {
    console.log("[e2e/global-setup] Skipping migrate + seed (PLAYWRIGHT_SKIP_SEED=1)");
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.warn(
      "[e2e/global-setup] DATABASE_URL not set — skipping migrate + seed. " +
        "Tests that need real data will fail. Set DATABASE_URL or " +
        "PLAYWRIGHT_SKIP_SEED=1 to silence this warning.",
    );
    return;
  }

  console.log("[e2e/global-setup] Running Payload migrations…");
  const migrate = spawnSync("npm", ["run", "migrate"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (migrate.status !== 0) {
    throw new Error(`Migrate failed with exit code ${migrate.status}`);
  }

  console.log("[e2e/global-setup] Seeding smoke fixtures…");
  const seed = spawnSync("npx", ["tsx", resolve(__dirname, "seed.ts")], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (seed.status !== 0) {
    throw new Error(`Seed failed with exit code ${seed.status}`);
  }
}
