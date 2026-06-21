import { useCallback, useRef, useState } from "react";

import ToastUtils from "@/utils/toastUtil";
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
 * Maximum time we believe a single action can legitimately take before
 * we assume something has gone wrong (a hung upstream, a broken promise
 * chain, a worker that crashed mid-request, etc.). After this, we
 * release the `pending` lock so the user can retry. The HTTP server's
 * own timeouts are tighter than this — any request that genuinely runs
 * longer is a bug, not a happy path.
 *
 * Symptom this guards against: `useAsyncAction.isPending` getting stuck
 * `true` forever when the action's promise never resolves (e.g. the
 * single-threaded `php artisan serve` was hung when the user clicked
 * once, the request was abandoned, but the FE state was never reset).
 * Without this watchdog, every subsequent click on the consuming button
 * hits the `if (action.isPending) return;` guard and silently no-ops —
 * surfacing as "Continue is broken" with zero user-visible feedback.
 */
const PENDING_WATCHDOG_MS = 90_000;

/**
 * Async UX contract primitive:
 * - consistent pending/success/error status
 * - normalized error message
 * - optional toast ownership per action
 * - watchdog auto-recovery — a stuck `pending` state self-releases after
 *   PENDING_WATCHDOG_MS so a hung upstream can't permanently freeze the
 *   UI button that owns this action's status.
 */
export const useAsyncAction = () => {
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runIdRef = useRef(0);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current !== null) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearWatchdog();
    setStatus("idle");
    setErrorMessage(null);
  }, [clearWatchdog]);

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

      // Arm the watchdog. If this action's promise NEVER resolves
      // (hung upstream, abandoned navigation, etc.) the timeout below
      // forcibly demotes status back to `idle` so the consuming button
      // becomes clickable again. We compare runIds so a watchdog from
      // run #N can't clobber the in-flight status of run #N+1.
      clearWatchdog();
      watchdogRef.current = setTimeout(() => {
        if (runId === runIdRef.current) {
          setStatus("idle");
          setErrorMessage(
            "Request appears to have hung. Resetting so you can retry. " +
              "If this keeps happening check the dev server / network panel."
          );
        }
      }, PENDING_WATCHDOG_MS);

      try {
        const result = await action();
        const elapsed = Date.now() - startedAt;
        if (elapsed < minPendingMs) {
          await wait(minPendingMs - elapsed);
        }

        if (runId === runIdRef.current) {
          clearWatchdog();
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
          clearWatchdog();
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
    [clearWatchdog]
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
