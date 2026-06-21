import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("@/utils/toastUtil", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { useAsyncAction } from "../useAsyncAction";
import ToastUtils from "@/utils/toastUtil";

describe("useAsyncAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts idle, transitions to success", async () => {
    const { result } = renderHook(() => useAsyncAction());
    expect(result.current.isIdle).toBe(true);

    await act(async () => {
      await result.current.run(
        async () => "ok",
        { minPendingMs: 0 }
      );
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.errorMessage).toBeNull();
  });

  it("transitions to error and normalizes the message", async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await expect(
        result.current.run(
          async () => {
            throw new Error("failed");
          },
          { minPendingMs: 0 }
        )
      ).rejects.toThrow("failed");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.errorMessage).toBe("failed");
  });

  it("shows success toast when string successToast is provided", async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.run(async () => ({ id: 1 }), {
        minPendingMs: 0,
        successToast: "Done",
      });
    });

    expect(ToastUtils.success).toHaveBeenCalledWith("Done", expect.any(Object));
  });

  it("swallows errors when rethrow=false and still sets error state", async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      const res = await result.current.run(
        async () => {
          throw new Error("x");
        },
        { minPendingMs: 0, rethrow: false }
      );
      expect(res).toBeUndefined();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("reset() returns state to idle", async () => {
    const { result } = renderHook(() => useAsyncAction());
    await act(async () => {
      await result.current
        .run(
          async () => {
            throw new Error("x");
          },
          { minPendingMs: 0 }
        )
        .catch(() => undefined);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    act(() => {
      result.current.reset();
    });
    expect(result.current.isIdle).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it("invokes onSuccess callback with action result", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.run(async () => 42, {
        minPendingMs: 0,
        onSuccess,
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(42);
  });

  /*
   * Watchdog contract:
   *
   * If an action's promise never resolves (a hung upstream, an abandoned
   * fetch, a dev server stuck on a single-threaded outbound call), the
   * `pending` status MUST self-release after PENDING_WATCHDOG_MS (90s)
   * so consuming buttons don't permanently no-op behind their
   * `if (action.isPending) return;` guards.
   *
   * The user-visible bug this prevents: "Continue is not working" — a
   * stuck-pending action whose owning button looks alive but silently
   * swallows every click. See ProtectionPlanStep + AdminCreateInstance.
   *
   * We can't wait 90 real seconds in a unit test, so we use
   * `vi.useFakeTimers()` to fast-forward.
   */
  it("auto-releases stuck pending state after the watchdog timeout", async () => {
    vi.useFakeTimers();

    try {
      const { result } = renderHook(() => useAsyncAction());

      let resolveAction: (() => void) | undefined;
      const neverResolves = new Promise<void>((resolve) => {
        resolveAction = resolve;
      });

      // Kick off an action that will never resolve.
      let runPromise: Promise<unknown> | undefined;
      act(() => {
        runPromise = result.current.run(async () => {
          await neverResolves;
          return "should never reach here";
        });
      });

      // Yield a microtask so the hook sees `status = pending`.
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.isPending).toBe(true);

      // Advance time past the watchdog threshold.
      await act(async () => {
        vi.advanceTimersByTime(90_001);
      });

      // Watchdog should have demoted status back to idle and surfaced
      // an explanatory error message.
      expect(result.current.isPending).toBe(false);
      expect(result.current.isIdle).toBe(true);
      expect(result.current.errorMessage).toMatch(/hung/i);

      // Clean up the dangling action promise so vitest doesn't warn
      // about unhandled rejections.
      resolveAction?.();
      await act(async () => {
        await runPromise?.catch(() => undefined);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("does NOT fire the watchdog when the action resolves before the timeout", async () => {
    vi.useFakeTimers();

    try {
      const { result } = renderHook(() => useAsyncAction());

      await act(async () => {
        await result.current.run(async () => "fast", { minPendingMs: 0 });
      });

      // Advance way past the watchdog threshold — the watchdog timer
      // should already have been cleared when the action resolved, so
      // no spurious "hung" error message should appear.
      await act(async () => {
        vi.advanceTimersByTime(120_000);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.errorMessage).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
