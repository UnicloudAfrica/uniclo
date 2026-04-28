import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoadingState from "../LoadingState";
import ErrorState from "../ErrorState";

describe("LoadingState", () => {
  it("default variant uses role=status, aria-live=polite", () => {
    render(<LoadingState />);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("inline variant has no message uses sr-only fallback", () => {
    render(<LoadingState variant="inline" />);
    const el = screen.getByRole("status");
    expect(el.querySelector(".sr-only")?.textContent).toBe("Loading…");
  });

  it("renders provided message instead of default", () => {
    render(<LoadingState message="Building topology…" />);
    expect(screen.getByText("Building topology…")).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("uses role=alert with aria-live=assertive", () => {
    render(<ErrorState />);
    const el = screen.getByRole("alert");
    expect(el).toHaveAttribute("aria-live", "assertive");
  });

  it("renders default title + message", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders retry button and fires onRetry", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} retryLabel="Retry now" />);
    fireEvent.click(screen.getByRole("button", { name: /retry now/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("displays diagnostic code when provided", () => {
    render(<ErrorState code="UPSTREAM_502" />);
    expect(screen.getByText(/UPSTREAM_502/)).toBeInTheDocument();
  });
});
