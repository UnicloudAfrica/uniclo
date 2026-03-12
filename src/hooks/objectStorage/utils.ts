import type { UnknownRecord } from "./types";

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export const resolveOptionValue = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value);
};

export const resolveString = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

export const isValidUuid = (value: string): boolean => {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};
