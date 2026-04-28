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
});
