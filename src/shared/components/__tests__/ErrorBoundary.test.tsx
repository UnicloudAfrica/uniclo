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
});
