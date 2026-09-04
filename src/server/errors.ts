/**
 * Server-side domain error. Throw from service-layer code when a business rule
 * would be violated — the admin route catch handler converts it into a proper
 * HTTP response (409 by default, override for other kinds of conflict).
 *
 * Distinct from `ValidationError` (schema-level, per-field) and `AdminAuthError`
 * (401/403). Prefer a specific status: 409 for conflict-with-state, 400 for
 * malformed intent that isn't schema-shaped.
 */
export class DomainError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 409) {
    super(message);
    this.name = "DomainError";
    this.statusCode = statusCode;
  }
}
