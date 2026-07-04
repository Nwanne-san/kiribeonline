import Redis from "ioredis";
import { NextResponse } from "next/server";
import { RATE_LIMIT_WINDOW_MS } from "@/constants";
import type { ApiErrorPayload } from "@/lib/api";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

/** In-memory fallback store — used only when REDIS_URL is unset or Redis errors. */
const store = new Map<string, RateLimitEntry>();

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
  key: string;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  /** Seconds until the window resets — drives the `Retry-After` header. */
  retryAfterSeconds: number;
};

/**
 * Thrown by rate-limited helpers that run inside a route's try/catch (e.g. the
 * admin write wrapper). Route error handlers translate it to a 429 response.
 */
export class RateLimitError extends Error {
  statusCode = 429;
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number, message = "Too many requests. Try again later.") {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// --- Redis (durable) store -------------------------------------------------

let redisClient: Redis | null = null;
let redisInitialised = false;

/**
 * Lazily create a single shared Redis client. Returns null when `REDIS_URL` is
 * unset (in-memory fallback), emitting a one-time warning in production so the
 * gap is visible rather than silent. The site must work without Redis
 * (CLAUDE.md stack constraint).
 */
function getRedis(): Redis | null {
  if (redisInitialised) return redisClient;
  redisInitialised = true;

  const url = process.env.REDIS_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] REDIS_URL not set — using in-memory store. Limits will not " +
          "hold across serverless instances or restarts."
      );
    }
    return null;
  }

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
  });
  redisClient.on("error", (err) => {
    console.error("[rate-limit] Redis error", err);
  });
  return redisClient;
}

async function checkRedis(
  redis: Redis,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `rl:${config.key}`;
  const now = Date.now();

  // Fixed-window counter: INCR, then set the TTL on the first hit of the window.
  const count = await redis.incr(key);
  let pttl: number;
  if (count === 1) {
    await redis.pexpire(key, config.windowMs);
    pttl = config.windowMs;
  } else {
    pttl = await redis.pttl(key);
    if (pttl < 0) {
      // Key exists without a TTL (edge case) — repair it so it can expire.
      await redis.pexpire(key, config.windowMs);
      pttl = config.windowMs;
    }
  }

  const resetAt = now + pttl;
  const allowed = count <= config.limit;
  return {
    allowed,
    remaining: allowed ? config.limit - count : 0,
    resetAt,
    retryAfterSeconds: allowed ? 0 : Math.ceil(pttl / 1000),
  };
}

// --- In-memory fallback store ----------------------------------------------

function checkMemory(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(config.key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(config.key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt, retryAfterSeconds: 0 };
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  store.set(config.key, entry);
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    retryAfterSeconds: 0,
  };
}

// --- Public API ------------------------------------------------------------

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis) {
    try {
      return await checkRedis(redis, config);
    } catch (err) {
      // Redis unavailable mid-request — fall back to the in-memory store so we
      // still apply some protection rather than failing fully open.
      console.error("[rate-limit] falling back to in-memory store", err);
    }
  }
  return checkMemory(config);
}

/** Resolve the effective limit for an endpoint, honouring the env override. */
function resolveLimit(endpoint: string, defaultLimit: number): number {
  const envKey = `${endpoint.toUpperCase().replace(/\//g, "_")}_RATE_LIMIT`;
  const envLimit = process.env[envKey];
  const limit = envLimit ? Number.parseInt(envLimit, 10) : defaultLimit;
  return Number.isFinite(limit) ? limit : defaultLimit;
}

export async function rateLimitForEndpoint(
  endpoint: string,
  identifier: string,
  defaultLimit = 5,
  windowMs = RATE_LIMIT_WINDOW_MS
): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `${endpoint}:${identifier}`,
    limit: resolveLimit(endpoint, defaultLimit),
    windowMs,
  });
}

// --- Read-only peek (does NOT increment) -----------------------------------

function peekRedisResult(
  raw: string | null,
  pttlMs: number,
  limit: number,
  windowMs: number
): RateLimitResult {
  const count = raw ? Number.parseInt(raw, 10) : 0;
  const pttl = pttlMs < 0 ? windowMs : pttlMs;
  const allowed = count < limit;
  return {
    allowed,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + pttl,
    retryAfterSeconds: allowed ? 0 : Math.ceil(pttl / 1000),
  };
}

function peekMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    return { allowed: true, remaining: limit, resetAt: now + windowMs, retryAfterSeconds: 0 };
  }
  const allowed = entry.count < limit;
  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    retryAfterSeconds: allowed ? 0 : Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Read a bucket's current state WITHOUT incrementing it. Use to gate an action
 * before the event that should actually count toward the limit (e.g. peek the
 * per-email login bucket before a login attempt, then increment only on failure).
 */
export async function peekRateLimit(
  endpoint: string,
  identifier: string,
  defaultLimit = 5,
  windowMs = RATE_LIMIT_WINDOW_MS
): Promise<RateLimitResult> {
  const limit = resolveLimit(endpoint, defaultLimit);
  const fullKey = `${endpoint}:${identifier}`;
  const redis = getRedis();
  if (redis) {
    try {
      const redisKey = `rl:${fullKey}`;
      const [raw, pttl] = await Promise.all([redis.get(redisKey), redis.pttl(redisKey)]);
      return peekRedisResult(raw, pttl, limit, windowMs);
    } catch (err) {
      console.error("[rate-limit] peek falling back to in-memory store", err);
    }
  }
  return peekMemory(fullKey, limit, windowMs);
}

/**
 * Build a 429 response with a `Retry-After` header from a rate-limit result.
 * Use in every rate-limited route so the client can back off.
 */
export function tooManyRequests(
  result: RateLimitResult,
  message = "Too many requests. Try again later."
) {
  return NextResponse.json<ApiErrorPayload>(
    { success: false, message, statusCode: 429 },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil(result.retryAfterSeconds))) },
    }
  );
}
