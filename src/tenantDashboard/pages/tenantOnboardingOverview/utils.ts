import type { ProgressSummary } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const normalizeProgress = (value: unknown, fallbackRequired: number): ProgressSummary => {
  const record = isRecord(value) ? value : {};
  const percentage = typeof record.percentage === "number" ? record.percentage : 0;
  const approved = typeof record.approved === "number" ? record.approved : 0;
  const required =
    typeof record.required === "number" ? record.required : Math.max(fallbackRequired, 0);
  return { percentage, approved, required };
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim() !== "") return error;
  if (isRecord(error) && typeof error.message === "string" && error.message.trim() !== "") {
    return error.message;
  }
  return fallback;
};

export const formatDateTime = (value: unknown) =>
  value ? new Date(String(value)).toLocaleString() : "\u2014";

export const flattenPayload = (payload: unknown, prefix = ""): Array<[string, unknown]> => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  return Object.entries(payload).flatMap(([key, value]): Array<[string, unknown]> => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value) && !("document_id" in value)) {
      return flattenPayload(value, path);
    }

    return [[path, value]];
  });
};
