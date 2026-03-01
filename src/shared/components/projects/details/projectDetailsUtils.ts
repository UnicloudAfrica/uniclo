export type ListResponse<T> = { data: T[] } | T[];

export const normalizeListResponse = <T>(value: unknown): ListResponse<T> | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "object" || value === null) return undefined;
  const data = (value as Record<string, unknown>)["data"];
  if (Array.isArray(data)) return { data: data as T[] };
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as Record<string, unknown>)["data"])
  ) {
    return { data: (data as Record<string, unknown>)["data"] as T[] };
  }
  return undefined;
};
