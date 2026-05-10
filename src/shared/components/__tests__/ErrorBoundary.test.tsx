import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("@/utils/sentry", () => ({
  captureException: vi.fn(),
}));

import ErrorBoundary from "../ErrorBoundary";
import { captureException } from "@/utils/sentry";

const Bomb = ({ msg = "boom" }: { msg?: string }) => {
  throw new Error(msg);
};

const ChunkBomb = ({ msg }: { msg: string }) => {
  const err = new Error(msg);
  throw err;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silence expected React error-boundary console noise
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  it("renders fallback UI when a child throws", () => {
    render(
      <ErrorBoundary fallback={<div>custom fallback</div>}>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("custom fallback")).toBeInTheDocument();
  });

  it("reports caught errors to Sentry via captureException", () => {
    render(
      <ErrorBoundary fallback={<div>fallback</div>}>
        <Bomb msg="boundary-err" />
      </ErrorBoundary>
    );
    expect(captureException).toHaveBeenCalled();
    const [err] = (captureException as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0];
    expect((err as Error).message).toBe("boundary-err");
  });

  describe("stale-chunk auto-recovery", () => {
    let reloadSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      sessionStorage.clear();
      reloadSpy = vi.fn();
      // jsdom defines location.reload as a non-configurable readonly,
      // but we can override the whole .location with a stub object.
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { reload: reloadSpy },
      });
    });

    it.each([
      "Failed to fetch dynamically imported module: http://localhost:3000/src/X.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
      "Loading chunk 42 failed.",
    ])("auto-reloads on Vite/webpack chunk-load error: %s", (msg) => {
      render(
        <ErrorBoundary fallback={<div>fallback</div>}>
          <ChunkBomb msg={msg} />
        </ErrorBoundary>
      );

      expect(reloadSpy).toHaveBeenCalledTimes(1);
      // Sentry MUST NOT be paged for routine stale-chunk hiccups.
      expect(captureException).not.toHaveBeenCalled();
    });

    it("does NOT auto-reload twice within the cooldown window", () => {
      // First crash: triggers a reload + sets cooldown flag.
      const { unmount } = render(
        <ErrorBoundary fallback={<div>fallback</div>}>
          <ChunkBomb msg="Failed to fetch dynamically imported module: x" />
        </ErrorBoundary>
      );
      expect(reloadSpy).toHaveBeenCalledTimes(1);
      unmount();

      // Second crash within the cooldown: render the fallback, do NOT
      // reload again — otherwise a genuinely-broken build would loop
      // forever. Sentry SHOULD see this one (not a transient anymore).
      render(
        <ErrorBoundary fallback={<div>fallback</div>}>
          <ChunkBomb msg="Failed to fetch dynamically imported module: x" />
        </ErrorBoundary>
      );

      expect(reloadSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText("fallback")).toBeInTheDocument();
      expect(captureException).toHaveBeenCalledTimes(1);
    });

    it("does NOT auto-reload on non-chunk errors", () => {
      render(
        <ErrorBoundary fallback={<div>fallback</div>}>
          <Bomb msg="ordinary runtime error" />
        </ErrorBoundary>
      );
      expect(reloadSpy).not.toHaveBeenCalled();
      expect(captureException).toHaveBeenCalledTimes(1);
      expect(screen.getByText("fallback")).toBeInTheDocument();
    });
  });
});
