/**
 * AppError
 * -------
 * A small, explicit error type used to standardize *all* API failures.
 *
 * Why this exists:
 * - Route/middleware code can throw/forward a meaningful error (status, code, details)
 * - The global `errorMiddleware` is the single place that formats HTTP error responses
 * - Tests and clients can rely on a stable `error.code` instead of string-matching messages
 */
export class AppError extends Error {
  /**
   * @param {Object} params
   * @param {number} params.status HTTP status code (e.g., 400, 401, 403, 404, 409)
   * @param {string} params.code Stable machine-readable code (e.g., "AUTH_NO_TOKEN")
   * @param {string} params.message Human-readable message
   * @param {any} [params.details] Optional structured context (validation fields, ids, etc.)
   * @param {Error} [params.cause] Optional underlying error (kept for logging/debugging)
   */
  constructor({ status, code, message, details, cause } = {}) {
    super(message || "Unexpected error");
    this.name = "AppError";
    this.status = typeof status === "number" ? status : 500;
    this.code = code || "INTERNAL_ERROR";
    this.details = details;
    this.cause = cause;
  }
}

/**
 * Helper to keep calling-sites concise.
 * Prefer `next(asAppError(...))` rather than repeating `new AppError(...)` everywhere.
 */
export function asAppError(params) {
  return new AppError(params);
}

