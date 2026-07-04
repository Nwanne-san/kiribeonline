/**
 * Cloudflare R2 is S3-compatible. Payload uses @payloadcms/storage-s3 when env is set.
 * See src/payload.config.ts and docs/DEVELOPER.md.
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_BUCKET_NAME &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_ACCOUNT_ID
  );
}

export function getR2PublicBaseUrl(): string | undefined {
  return process.env.R2_PUBLIC_URL;
}
