/**
 * @deprecated Use `import { api } from "@/lib/api"` with `{ silent: true }`.
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const clientSilentApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: Record<string, unknown> | FormData | null = null
): Promise<T> => api.request<T>(method, path, body as any, { silent: true });

export default clientSilentApi;
