type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const pickString = (...candidates: unknown[]): string | null => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
};

/**
 * Normalize unknown async errors into user-facing messages.
 */
export const getAsyncErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();

  const record = asRecord(error);
  const data = asRecord(record.data);
  const response = asRecord(record.response);
  const responseData = asRecord(response.data);

  return (
    pickString(
      record.message,
      record.error,
      data.message,
      data.error,
      responseData.message,
      responseData.error
    ) || fallback
  );
};
