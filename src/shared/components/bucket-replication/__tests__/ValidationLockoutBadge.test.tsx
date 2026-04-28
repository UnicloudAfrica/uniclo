import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import ValidationLockoutBadge from "../ValidationLockoutBadge";

/**
 * ValidationLockoutBadge unit tests.
 *
 * Three input states:
 *   - locked (validation_locked_at set) → red lock badge + sr-only live region
 *   - soft (1-2 fails, not yet locked) → amber count, threshold hint
 *   - healthy (no fails, not locked) → renders ONLY the empty live region
 *     (M2: always-present so transitions get announced)
 *
 * Compact mode shrinks the visible labels but keeps the same semantics.
 */

type Endpoint = Parameters<typeof ValidationLockoutBadge>[0]["endpoint"];

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    consecutive_validation_failures: 0,
    validation_locked_at: null,
    validation_locked_reason: null,
    ...overrides,
  } as Endpoint;
}

describe("ValidationLockoutBadge", () => {
  // ─── Healthy (no fails, not locked) ───────────────────────────────

  it("renders only an empty sr-only live region when healthy", () => {
    const { container } = render(
      <ValidationLockoutBadge endpoint={makeEndpoint()} />,
    );
    // M2: always-present sr-only span so screen readers announce
    // transitions.
    const live = container.querySelector('[role="status"][aria-live="polite"]');
    expect(live).toBeInTheDocument();
    expect(live).toHaveClass("sr-only");
    expect(live?.textContent).toBe(""); // empty announcement when healthy

    // No visible badge text
    expect(screen.queryByText(/LOCKED/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/validation fail/i)).not.toBeInTheDocument();
  });

  // ─── Soft warning (1-2 fails, not locked) ────────────────────────

  it("renders amber soft-warning at 1 fail", () => {
    render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({ consecutive_validation_failures: 1 })}
      />,
    );
    expect(screen.getByText(/1 validation fail$/)).toBeInTheDocument();
  });

  it("uses plural 'fails' at 2 failures", () => {
    render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({ consecutive_validation_failures: 2 })}
      />,
    );
    expect(screen.getByText(/2 validation fails/)).toBeInTheDocument();
  });

  it("compact mode shows count/threshold ratio (1/3, 2/3)", () => {
    const { rerender } = render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({ consecutive_validation_failures: 1 })}
        compact
      />,
    );
    expect(screen.getByText("1/3")).toBeInTheDocument();

    rerender(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({ consecutive_validation_failures: 2 })}
        compact
      />,
    );
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("announces remaining-attempts in soft state via live region", () => {
    const { container } = render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({ consecutive_validation_failures: 2 })}
      />,
    );
    const live = container.querySelector('[role="status"][aria-live="polite"]');
    expect(live?.textContent).toMatch(/2 validation failures.*1 until lockout/i);
  });

  // ─── Locked ───────────────────────────────────────────────────────

  it("renders red LOCKED badge when validation_locked_at is set", () => {
    render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({
          consecutive_validation_failures: 3,
          validation_locked_at: "2026-04-20T12:00:00Z",
        })}
      />,
    );
    expect(screen.getByText(/LOCKED · 3 fails/)).toBeInTheDocument();
  });

  it("compact mode shows only the failure count when locked", () => {
    render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({
          consecutive_validation_failures: 5,
          validation_locked_at: "2026-04-20T12:00:00Z",
        })}
        compact
      />,
    );
    // Compact lock state shows just the number, no "LOCKED ·" prefix
    const badge = screen.getByText("5");
    expect(badge).toBeInTheDocument();
  });

  it("uses validation_locked_reason as the title attribute", () => {
    const { container } = render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({
          consecutive_validation_failures: 3,
          validation_locked_at: "2026-04-20T12:00:00Z",
          validation_locked_reason: "AccessDenied: invalid credentials",
        })}
      />,
    );
    // Visible badge is the [aria-hidden][title] span; the sr-only live
    // region also contains LOCKED text but has no title attr.
    const badge = container.querySelector(
      'span[aria-hidden="true"][title]',
    );
    expect(badge).toHaveAttribute("title", "AccessDenied: invalid credentials");
  });

  it("falls back to default title when no validation_locked_reason", () => {
    const { container } = render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({
          consecutive_validation_failures: 3,
          validation_locked_at: "2026-04-20T12:00:00Z",
        })}
      />,
    );
    const badge = container.querySelector('span[aria-hidden="true"][title]');
    expect(badge?.getAttribute("title")).toMatch(/SEC-AUDIT-BUCKET-5/);
  });

  it("locked state announces reason via live region", () => {
    const { container } = render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({
          consecutive_validation_failures: 3,
          validation_locked_at: "2026-04-20T12:00:00Z",
          validation_locked_reason: "AccessDenied",
        })}
      />,
    );
    const live = container.querySelector('[role="status"][aria-live="polite"]');
    expect(live?.textContent).toMatch(/Endpoint locked/i);
    expect(live?.textContent).toMatch(/AccessDenied/i);
  });

  // ─── Visual badge is aria-hidden (no double-announce) ─────────────

  it("visible badge is aria-hidden so screen readers only get the live-region text", () => {
    const { container } = render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({
          consecutive_validation_failures: 3,
          validation_locked_at: "2026-04-20T12:00:00Z",
        })}
      />,
    );
    const visibleBadge = container.querySelector('span[aria-hidden="true"]');
    expect(visibleBadge).toBeInTheDocument();
    expect(visibleBadge).toHaveTextContent(/LOCKED/);
  });

  it("custom className threads through to the visible badge", () => {
    const { container } = render(
      <ValidationLockoutBadge
        endpoint={makeEndpoint({ consecutive_validation_failures: 1 })}
        className="my-custom-class"
      />,
    );
    expect(container.querySelector(".my-custom-class")).toBeInTheDocument();
  });
});
