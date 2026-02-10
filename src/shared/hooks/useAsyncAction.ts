import { useCallback, useRef, useState } from "react";

import ToastUtils from "../../utils/toastUtil";
import { getAsyncErrorMessage } from "../utils/asyncError";

export type AsyncStatus = "idle" | "pending" | "success" | "error";

type ToastResolver<TResult> = string | false | ((result: TResult) => string | null | undefined);
type ErrorToastResolver =
  | string
  | false
  | ((message: string, error: unknown) => string | null | undefined);

interface AsyncRunOptions<TResult> {
  minPendingMs?: number;
  successToast?: ToastResolver<TResult>;
  errorToast?: ErrorToastResolver;
  successDescription?: string | ((result: TResult) => string | undefined);
  errorDescription?: string | ((message: string, error: unknown) => string | undefined);
  fallbackErrorMessage?: string;
  onSuccess?: (result: TResult) => void | Promise<void>;
  onError?: (error: unknown, message: string) => void | Promise<void>;
  rethrow?: boolean;
}

const resolveSuccessToast = <T>(
  resolver: ToastResolver<T> | undefined,
  result: T
): string | null => {
  if (resolver === false) return null;
  if (typeof resolver === "function") return resolver(result) || null;
  if (typeof resolver === "string") return resolver;
  return null;
};

const resolveErrorToast = (
  resolver: ErrorToastResolver | undefined,
  message: string,
  error: unknown
): string | null => {
  if (resolver === false) return null;
  if (typeof resolver === "function") return resolver(message, error) || null;
  if (typeof resolver === "string") return resolver;
  return message;
};

const resolveDescription = <T>(
  resolver: string | ((value: T) => string | undefined) | undefined,
  value: T
): string | undefined => {
  if (!resolver) return undefined;
  if (typeof resolver === "function") return resolver(value);
  return resolver;
};

const resolveErrorDescription = (
  resolver: string | ((message: string, error: unknown) => string | undefined) | undefined,
  message: string,
  error: unknown
): string | undefined => {
  if (!resolver) return undefined;
  if (typeof resolver === "function") return resolver(message, error);
  return resolver;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Async UX contract primitive:
 * - consistent pending/success/error status
 * - normalized error message
 * - optional toast ownership per action
 */
export const useAsyncAction = () => {
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const run = useCallback(
    async <TResult>(
      action: () => Promise<TResult>,
      options: AsyncRunOptions<TResult> = {}
    ): Promise<TResult | undefined> => {
      const runId = ++runIdRef.current;
      const startedAt = Date.now();
      const minPendingMs = Math.max(0, options.minPendingMs ?? 250);

      setStatus("pending");
      setErrorMessage(null);

      try {
        const result = await action();
        const elapsed = Date.now() - startedAt;
        if (elapsed < minPendingMs) {
          await wait(minPendingMs - elapsed);
        }

        if (runId === runIdRef.current) {
          setStatus("success");
          const successMessage = resolveSuccessToast(options.successToast, result);
          if (successMessage) {
            ToastUtils.success(successMessage, {
              description: resolveDescription(options.successDescription, result),
            });
          }
        }

        if (options.onSuccess) {
          await options.onSuccess(result);
        }

        return result;
      } catch (error) {
        const message = getAsyncErrorMessage(error, options.fallbackErrorMessage);

        if (runId === runIdRef.current) {
          setStatus("error");
          setErrorMessage(message);

          const errorToast = resolveErrorToast(options.errorToast, message, error);
          if (errorToast) {
            ToastUtils.error(errorToast, {
              description: resolveErrorDescription(options.errorDescription, message, error),
            });
          }
        }

        if (options.onError) {
          await options.onError(error, message);
        }

        if (options.rethrow ?? true) {
          throw error;
        }

        return undefined;
      }
    },
    []
  );

  return {
    run,
    reset,
    status,
    errorMessage,
    isIdle: status === "idle",
    isPending: status === "pending",
    isSuccess: status === "success",
    isError: status === "error",
  };
};
