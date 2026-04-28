/**
 * @deprecated Use `import { api } from "@/lib/api"` and `api.download()` instead.
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const adminFileApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: Record<string, unknown> | null = null
): Promise<T> => api.request<T>(method, path, body);

export default adminFileApi;
