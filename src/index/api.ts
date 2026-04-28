/**
 * @deprecated Use `import { api } from "@/lib/api"` instead.
 * Shared API client — backward-compat wrapper.
 */
import { api } from "../lib/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string | { message: string };
  error?: string;
  two_factor_required?: boolean;
  [key: string]: unknown;
}

const sharedApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: Record<string, unknown> | FormData | null = null
): Promise<T> => api.request<T>(method, path, body as unknown);

export default sharedApi;
