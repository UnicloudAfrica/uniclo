/**
 * AdminDashboard now renders REAL counts from the instances + projects
 * endpoints instead of the previous hardcoded demo figures (₦284,500 spend,
 * ₦12,500 credits, "Premium", "12.4 TB", "archive-q1 80% in 14 days").
 *
 * This test feeds a known fleet/project set and asserts the live counts show
 * while none of the old fabricated values remain.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/utils/adminAuthRedirect", () => ({ default: () => ({ isLoading: false }) }));

vi.mock("@/stores/authStore", () => ({
  default: (selector: (s: { user: { name: string } }) => unknown) =>
    selector({ user: { name: "Daniel Akintolu" } }),
}));

vi.mock("../../components/AdminPageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Thin presentational stubs — the real ones animate via IntersectionObserver
// (absent in jsdom). We only care that AdminDashboard passes the right values.
vi.mock("@/shared/components/ui", () => ({
  ModernButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  ModernCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModernStatsCard: ({
    title,
    value,
    description,
  }: {
    title: string;
    value: string | number;
    description?: string;
  }) => (
    <div>
      <span>{title}</span>
      <span>{value}</span>
      <span>{description}</span>
    </div>
  ),
  StatusPill: ({ label }: { label: string }) => <span>{label}</span>,
  DashboardSkeleton: () => <div>loading</div>,
}));

vi.mock("@/shared/components/ui/ModernTable", () => ({
  default: ({ emptyMessage }: { emptyMessage?: string }) => <div>{emptyMessage}</div>,
}));

vi.mock("@/shared/components/dashboard", () => ({
  CommandCenterHero: ({
    greetingName,
    chips,
  }: {
    greetingName?: string;
    chips?: Array<{ label: string; value: string }>;
  }) => (
    <div>
      <span>{greetingName}</span>
      {chips?.map((c) => (
        <span key={c.label}>{`${c.label}=${c.value}`}</span>
      ))}
    </div>
  ),
}));

vi.mock("@/shared/hooks/resources/instanceHooks", () => ({
  useFetchPurchasedInstances: vi.fn(),
}));
vi.mock("@/shared/hooks/resources/projectHooks", () => ({
  useFetchProjects: vi.fn(),
}));

import { useFetchPurchasedInstances } from "@/shared/hooks/resources/instanceHooks";
import { useFetchProjects } from "@/shared/hooks/resources/projectHooks";
import AdminDashboard from "../AdminDashboard";

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );

beforeEach(() => {
  // 17 instances = 3 active + 1 error + 13 pending(=provisioning).
  const instances = [
    ...Array.from({ length: 3 }, () => ({ status: "active" })),
    { status: "error" },
    ...Array.from({ length: 13 }, () => ({ status: "pending" })),
  ];
  vi.mocked(useFetchPurchasedInstances).mockReturnValue({
    data: { data: instances },
  } as never);
  vi.mocked(useFetchProjects).mockReturnValue({
    data: { data: [], meta: { total: 5 } },
  } as never);
});

describe("AdminDashboard real-data tiles", () => {
  it("shows live fleet + project counts", () => {
    renderDashboard();

    // Total instances (17) appears on the card + hero chip.
    expect(screen.getAllByText("17").length).toBeGreaterThan(0);
    // Provisioning card reflects the 13 pending instances (the old bug showed 0).
    expect(screen.getByText("Provisioning")).toBeInTheDocument();
    expect(screen.getAllByText("13").length).toBeGreaterThan(0);
    // Projects count from meta.total.
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
  });

  it("no longer renders the hardcoded demo figures", () => {
    renderDashboard();

    expect(screen.queryByText("₦284,500")).toBeNull();
    expect(screen.queryByText("₦12,500")).toBeNull();
    expect(screen.queryByText("Premium")).toBeNull();
    expect(screen.queryByText("12.4 TB")).toBeNull();
    expect(screen.queryByText(/archive-q1/)).toBeNull();
  });
});
