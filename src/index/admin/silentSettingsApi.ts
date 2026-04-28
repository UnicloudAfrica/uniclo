/**
 * @deprecated Use `import { api } from "@/lib/api"` with `{ silent: true }` option.
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const adminSilentSettingsApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: Record<string, unknown> | null = null
): Promise<T> => api.request<T>(method, path, body, { silent: true });

export default adminSilentSettingsApi;
