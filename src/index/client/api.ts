/**
 * @deprecated Use `import { api } from "@/lib/api"` instead.
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const clientApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: Record<string, unknown> | FormData | null = null
): Promise<T> => api.request<T>(method, path, body as unknown);

export default clientApi;
