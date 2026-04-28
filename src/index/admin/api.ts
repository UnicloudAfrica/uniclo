/**
 * @deprecated Use `import { api } from "@/lib/api"` instead.
 * Backward-compat wrapper: delegates to the unified API client.
 * Supports both callable syntax: adminApi("GET", "/path")
 * and method syntax: adminApi.get("/path")
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ApiBody = Record<string, unknown> | FormData | null;
type NormalizedBody = Record<string, unknown> | null | undefined;

// FormData is passed through via unknown cast since the underlying client
// accepts it via its upload() helper in normal use.
const normalizeBody = (body: ApiBody): NormalizedBody =>
  body instanceof FormData ? (body as unknown as Record<string, unknown>) : body;

const callableApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: ApiBody = null
): Promise<T> => api.request<T>(method, path, normalizeBody(body));

// Add method-based access for components that use adminApi.get(), adminApi.post(), etc.
const adminApi = Object.assign(callableApi, {
  get: <T = unknown>(path: string, opts?: { silent?: boolean }) => api.get<T>(path, opts),
  post: <T = unknown>(path: string, body?: ApiBody, opts?: { silent?: boolean }) =>
    api.post<T>(path, normalizeBody(body ?? null), opts),
  put: <T = unknown>(path: string, body?: ApiBody, opts?: { silent?: boolean }) =>
    api.put<T>(path, normalizeBody(body ?? null), opts),
  patch: <T = unknown>(path: string, body?: ApiBody, opts?: { silent?: boolean }) =>
    api.patch<T>(path, normalizeBody(body ?? null), opts),
  delete: <T = unknown>(path: string, body?: ApiBody, opts?: { silent?: boolean }) =>
    api.delete<T>(path, normalizeBody(body ?? null), opts),
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
): Promise<T> => api.request<T>(method, path, normalizeBody(body), { silent: true });

export type { HttpMethod };
export default adminApi;
