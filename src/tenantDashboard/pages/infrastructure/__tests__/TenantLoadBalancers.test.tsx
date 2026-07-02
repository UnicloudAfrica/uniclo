import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const { mockUseFetchProjectById } = vi.hoisted(() => ({
  mockUseFetchProjectById: vi.fn(),
}));

vi.mock("@/shared/hooks/resources/projectHooks", () => ({
  useFetchProjectById: (id: string) => mockUseFetchProjectById(id),
}));

vi.mock("@/hooks/adminHooks/loadBalancerHooks", () => ({
  useLoadBalancers: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useDeleteLoadBalancer: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("../../../components/TenantPageShell", () => ({
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

import TenantLoadBalancers from "../TenantLoadBalancers";

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard/infrastructure/load-balancers?project=p1"]}>
      <TenantLoadBalancers />
    </MemoryRouter>,
  );

describe("TenantLoadBalancers provider gating", () => {
  beforeEach(() => mockUseFetchProjectById.mockReset());

  it("hides load balancers when the provider does not support them", () => {
    mockUseFetchProjectById.mockReturnValue({
      data: { provider_features: { load_balancers: false } },
    });

    renderPage();

    expect(screen.getByText(/not available in this availability zone/i)).toBeInTheDocument();
    expect(screen.queryByText(/Create Load Balancer/i)).not.toBeInTheDocument();
  });

  it("shows the create surface when the provider supports load balancers", () => {
    mockUseFetchProjectById.mockReturnValue({
      data: { provider_features: { load_balancers: true } },
    });

    renderPage();

    expect(screen.getAllByText(/Create Load Balancer/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/not available in this availability zone/i)).not.toBeInTheDocument();
  });
});
