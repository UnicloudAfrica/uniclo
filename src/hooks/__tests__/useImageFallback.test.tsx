import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import useImageFallback from "../useImageFallback";

describe("useImageFallback", () => {
  it("returns the primary src when it is truthy", () => {
    const { result } = renderHook(() => useImageFallback("/a.png", "/b.png"));
    expect(result.current.src).toBe("/a.png");
  });

  it("falls back when primary is empty", () => {
    const { result } = renderHook(() => useImageFallback("", "/fallback.png"));
    expect(result.current.src).toBe("/fallback.png");
  });

  it("updates when the primary changes", () => {
    const { result, rerender } = renderHook(
      ({ primary }: { primary: string }) => useImageFallback(primary, "/b.png"),
      { initialProps: { primary: "/a.png" } },
    );
    expect(result.current.src).toBe("/a.png");

    rerender({ primary: "/c.png" });
    expect(result.current.src).toBe("/c.png");
  });

  it("onError swaps to the fallback and is idempotent", () => {
    const { result } = renderHook(() => useImageFallback("/primary.png", "/fallback.png"));
    expect(result.current.src).toBe("/primary.png");

    act(() => {
      result.current.onError();
    });
    expect(result.current.src).toBe("/fallback.png");

    // Calling again should NOT oscillate back to primary.
    act(() => {
      result.current.onError();
    });
    expect(result.current.src).toBe("/fallback.png");
  });

  it("onError is a no-op when no fallback is set", () => {
    const { result } = renderHook(() => useImageFallback("/primary.png", ""));
    expect(result.current.src).toBe("/primary.png");

    act(() => {
      result.current.onError();
    });
    expect(result.current.src).toBe("/primary.png");
  });
});
