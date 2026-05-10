import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ProviderGate,
  useProjectCapabilities,
  useProviderSupports,
  type ProjectCapabilities,
} from "../projectCapabilitiesHooks";
import React from "react";

const adminApiGet = vi.fn();

vi.mock("../../../../index/admin/api", () => ({
  default: {
    get: (path: string) => adminApiGet(path),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

const NOBUS_CAPS: ProjectCapabilities = {
  provider: "nobus",
  region: "uni-ng-lag-az2",
  core: { compute: true, network: true, storage: true },
  features: {
    supportsVpc: true,
    supportsSubnets: true,
    supportsSecurityGroups: true,
    supportsVpcPeering: false,
    supportsNetworkAcl: false,
    supportsLoadBalancer: false,
    supportsNatGateway: false,
  },
};

const ZADARA_CAPS: ProjectCapabilities = {
  provider: "zadara",
  region: "lagos-1",
  core: { compute: true, network: true, storage: true },
  features: {
    supportsVpc: true,
    supportsVpcPeering: true,
    supportsNetworkAcl: true,
    supportsLoadBalancer: true,
    supportsNatGateway: true,
  },
};

describe("ProviderGate", () => {
  beforeEach(() => {
    adminApiGet.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children when feature is supported", async () => {
    adminApiGet.mockResolvedValue({ data: ZADARA_CAPS });

    render(
      <ProviderGate projectId="ABC123" feature="supportsVpcPeering" loading="hide">
        <div>VPC Peering Tab</div>
      </ProviderGate>,
      { wrapper }
    );

    await waitFor(() => expect(screen.getByText("VPC Peering Tab")).toBeTruthy());
  });

  it("hides children when feature is NOT supported (Nobus + VPC Peering)", async () => {
    adminApiGet.mockResolvedValue({ data: NOBUS_CAPS });

    render(
      <ProviderGate projectId="ABC123" feature="supportsVpcPeering" loading="hide">
        <div>VPC Peering Tab</div>
      </ProviderGate>,
      { wrapper }
    );

    await waitFor(() => expect(adminApiGet).toHaveBeenCalled());
    // Settle one more tick so the gate re-renders with the result
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.queryByText("VPC Peering Tab")).toBeNull();
  });

  it("renders fallback when feature is unsupported", async () => {
    adminApiGet.mockResolvedValue({ data: NOBUS_CAPS });

    render(
      <ProviderGate
        projectId="ABC123"
        feature="supportsLoadBalancer"
        fallback={<div>Not available on this provider</div>}
        loading="hide"
      >
        <div>Load Balancer Tab</div>
      </ProviderGate>,
      { wrapper }
    );

    await waitFor(() => expect(screen.getByText("Not available on this provider")).toBeTruthy());
    expect(screen.queryByText("Load Balancer Tab")).toBeNull();
  });

  it("optimistically shows children while loading (default)", () => {
    adminApiGet.mockImplementation(() => new Promise(() => {})); // never resolves

    render(
      <ProviderGate projectId="ABC123" feature="supportsVpcPeering">
        <div>VPC Peering Tab</div>
      </ProviderGate>,
      { wrapper }
    );

    // Default `loading="show"` — show children immediately.
    // Better UX than flash of nothing for the common-case provider that supports everything.
    expect(screen.getByText("VPC Peering Tab")).toBeTruthy();
  });

  it("renders defensive fallthrough (children) when capabilities response is missing", async () => {
    // If the backend returns an empty/null body, default to showing the
    // children — better to over-show a working feature than to hide it
    // because of a network blip.
    adminApiGet.mockResolvedValue({ data: null });

    render(
      <ProviderGate projectId="ABC123" feature="supportsVpcPeering" loading="hide">
        <div>VPC Peering Tab</div>
      </ProviderGate>,
      { wrapper }
    );

    await waitFor(() => expect(adminApiGet).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByText("VPC Peering Tab")).toBeTruthy();
  });

  it("does not fetch when projectId is null", () => {
    render(
      <ProviderGate projectId={null} feature="supportsVpcPeering">
        <div>Whatever</div>
      </ProviderGate>,
      { wrapper }
    );

    // The query's enabled flag is Boolean(projectIdentifier), so no fetch fires.
    expect(adminApiGet).not.toHaveBeenCalled();
  });
});

describe("useProviderSupports", () => {
  beforeEach(() => {
    adminApiGet.mockReset();
  });

  it("returns true for supported feature", async () => {
    adminApiGet.mockResolvedValue({ data: ZADARA_CAPS });

    let captured: boolean | undefined;
    const Probe = () => {
      captured = useProviderSupports("ABC123", "supportsVpcPeering");
      return null;
    };
    render(<Probe />, { wrapper });

    await waitFor(() => expect(captured).toBe(true));
  });

  it("returns false for unsupported feature", async () => {
    adminApiGet.mockResolvedValue({ data: NOBUS_CAPS });

    let captured: boolean | undefined;
    const Probe = () => {
      captured = useProviderSupports("ABC123", "supportsVpcPeering");
      return null;
    };
    render(<Probe />, { wrapper });

    await waitFor(() => expect(captured).toBe(false));
  });
});

describe("useProjectCapabilities", () => {
  beforeEach(() => {
    adminApiGet.mockReset();
  });

  it("hits the right endpoint", async () => {
    adminApiGet.mockResolvedValue({ data: NOBUS_CAPS });

    let data: ProjectCapabilities | null | undefined;
    const Probe = () => {
      const q = useProjectCapabilities("ABC123");
      data = q.data;
      return null;
    };
    render(<Probe />, { wrapper });

    await waitFor(() => {
      expect(adminApiGet).toHaveBeenCalledWith("/projects/ABC123/capabilities");
      expect(data?.provider).toBe("nobus");
    });
  });
});
