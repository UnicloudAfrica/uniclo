/**
 * Smoke tests for the four Shield stub pages.
 *
 * Verifies that each page renders a proper EmptyState (with its heading and
 * a "Go to Domains" link) instead of silently redirecting via <Navigate>.
 *
 * None of these pages call any API hooks, so no QueryClient or apiRegistry
 * mocking is needed.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Prevent Navigate from actually redirecting in jsdom ───────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    Navigate: (props: { to: string }) => {
      mockNavigate(props.to);
      return null;
    },
  };
});

// ── Pages under test ──────────────────────────────────────────────────
import ClientShieldFirewall from "../ClientShieldFirewall";
import ClientShieldAnalytics from "../ClientShieldAnalytics";
import ClientShieldAttacks from "../ClientShieldAttacks";
import ClientShieldSsl from "../ClientShieldSsl";

const renderInRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

// ── Tests ─────────────────────────────────────────────────────────────

describe("ClientShieldFirewall", () => {
  it("renders the firewall heading without redirecting", () => {
    renderInRouter(<ClientShieldFirewall />);
    expect(screen.getByText("Select a domain to manage its firewall")).toBeTruthy();
    expect(screen.getByText("Go to Domains")).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("ClientShieldAnalytics", () => {
  it("renders the analytics heading without redirecting", () => {
    renderInRouter(<ClientShieldAnalytics />);
    expect(screen.getByText("Select a domain to view its analytics")).toBeTruthy();
    expect(screen.getByText("Go to Domains")).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("ClientShieldAttacks", () => {
  it("renders the attacks heading without redirecting", () => {
    renderInRouter(<ClientShieldAttacks />);
    expect(screen.getByText("Select a domain to view its attack history")).toBeTruthy();
    expect(screen.getByText("Go to Domains")).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("ClientShieldSsl", () => {
  it("renders the SSL heading without redirecting", () => {
    renderInRouter(<ClientShieldSsl />);
    expect(screen.getByText("Select a domain to manage its SSL certificate")).toBeTruthy();
    expect(screen.getByText("Go to Domains")).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
