/**
 * Typed API error thrown by the API clients (createApiClient et al.).
 *
 * Carries the HTTP status + parsed body so consumers can branch on the
 * distinction instead of regexing the message — e.g. `status === 409` to
 * re-fetch a stale quote (never charge an unseen price), or `fieldErrors` to
 * light up the offending form fields on a 422.
 *
 * It extends Error, so every existing `catch (e) { e.message }` /
 * `e instanceof Error` / getAsyncErrorMessage path keeps working unchanged —
 * the status/body/fieldErrors are purely additive.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    body: unknown,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.fieldErrors = fieldErrors;
    // Restore the prototype chain — required for `instanceof ApiError` to hold
    // after TypeScript down-levels a subclass of the built-in Error.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/**
 * Pull Laravel-style validation errors ({ errors: { field: string[] } }) out of
 * a response body, whether at the top level or nested under `data`. Returns
 * undefined when there are none, so callers can `if (err.fieldErrors)`.
 */
export const extractFieldErrors = (
  body: unknown,
): Record<string, string[]> | undefined => {
  const record = (body ?? {}) as Record<string, unknown>;
  const data = (record.data ?? {}) as Record<string, unknown>;
  const raw = record.errors ?? data.errors;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const out: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(raw as Record<string, unknown>)) {
    out[field] = Array.isArray(messages) ? messages.map(String) : [String(messages)];
  }
  return Object.keys(out).length ? out : undefined;
};
