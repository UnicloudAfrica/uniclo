/**
 * Internal helper — extracts a human-readable message from a thrown
 * error or an axios-style rejection. Shared by FailoverWizard and
 * AccessGrantManager.
 *
 * Consumes:
 *   - `Error` instances → `error.message`
 *   - axios-style `{ response: { data: { message, error_code } } }` →
 *     formats as `error_code: message`
 *   - plain strings → returned verbatim
 *
 * Returns `undefined` when nothing useful can be extracted — caller
 * decides the fallback.
 *
 * NOT exported from the package barrel — this is an internal-only
 * helper. Consumers that need this kind of error decoding should use
 * the existing `bucketErrorTranslator` for full structured-code
 * translation; this is just the cheap "show something in the modal"
 * path that doesn't depend on the translator's table.
 */
export function extractErrorMessage(e: unknown): string | undefined {
  if (typeof e === "string") return e || undefined;
  if (e instanceof Error) {
    return e.message || undefined;
  }
  if (e && typeof e === "object") {
    const err = e as {
      response?: { data?: { message?: string; error_code?: string } };
      message?: string;
    };
    const code = err.response?.data?.error_code;
    const msg = err.response?.data?.message ?? err.message;
    if (!msg && !code) return undefined;
    return code ? `${code}: ${msg ?? "(no message)"}` : msg;
  }
  return undefined;
}
