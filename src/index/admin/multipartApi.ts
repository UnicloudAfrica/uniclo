/**
 * @deprecated Use `import { api } from "@/lib/api"` and `api.upload()` instead.
 */
import { api } from "../../lib/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const adminMultipartApi = <T = unknown>(
  method: HttpMethod,
  path: string,
  body: FormData | Record<string, unknown> | null = null
): Promise<T> =>
  api.request<T>(method, path, body as unknown as Record<string, unknown> | null);

export default adminMultipartApi;
