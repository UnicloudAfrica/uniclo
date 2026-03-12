/**
 * @deprecated Use `import { api } from "@/lib/api"` instead.
 * Backward-compat wrapper: delegates to the unified API client.
 * Supports both callable syntax: adminApi("GET", "/path")
 * and method syntax: adminApi.get("/path")
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ApiBody = Record<string, unknown> | FormData | null;

const callableApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: ApiBody = null
): Promise<T> => api.request<T>(method, path, body as any);

// Add method-based access for components that use adminApi.get(), adminApi.post(), etc.
const adminApi = Object.assign(callableApi, {
  get: <T = unknown>(path: string, opts?: { silent?: boolean }) => api.get<T>(path, opts),
  post: <T = unknown>(path: string, body?: ApiBody, opts?: { silent?: boolean }) =>
    api.post<T>(path, body as any, opts),
  put: <T = unknown>(path: string, body?: ApiBody, opts?: { silent?: boolean }) =>
    api.put<T>(path, body as any, opts),
  patch: <T = unknown>(path: string, body?: ApiBody, opts?: { silent?: boolean }) =>
    api.patch<T>(path, body as any, opts),
  delete: <T = unknown>(path: string, body?: ApiBody, opts?: { silent?: boolean }) =>
    api.delete<T>(path, body as any, opts),
  upload: <T = unknown>(path: string, formData: FormData, opts?: { silent?: boolean }) =>
    api.upload<T>(path, formData, opts),
  download: (path: string, opts?: { silent?: boolean }) => api.download(path, opts),
});

/**
 * @deprecated Use `import { api } from "@/lib/api"` with `{ silent: true }` option.
 */
export const adminSilentApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: ApiBody = null
): Promise<T> => api.request<T>(method, path, body as any, { silent: true });

export type { HttpMethod };
export default adminApi;
