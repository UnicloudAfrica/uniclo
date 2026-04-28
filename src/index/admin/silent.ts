/**
 * @deprecated Use `import { api } from "@/lib/api"` with `{ silent: true }` option.
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const adminSilentApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: Record<string, unknown> | FormData | null = null
): Promise<T> =>
  api.request<T>(method, path, body as unknown as Record<string, unknown> | null, {
    silent: true,
  });

export default adminSilentApi;
