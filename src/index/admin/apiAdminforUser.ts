/**
 * @deprecated Use `import { api } from "@/lib/api"` instead.
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const apiAdminForUser = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: Record<string, unknown> | null = null
): Promise<T> => api.request<T>(method, path, body);

export default apiAdminForUser;
