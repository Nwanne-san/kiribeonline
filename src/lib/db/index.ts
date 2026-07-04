export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
