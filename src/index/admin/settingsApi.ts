/**
 * @deprecated Use `import { api } from "@/lib/api"` instead.
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const adminSettingsApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: Record<string, unknown> | FormData | null = null
): Promise<T> =>
  api.request<T>(method, path, body as unknown as Record<string, unknown> | null);

export default adminSettingsApi;
