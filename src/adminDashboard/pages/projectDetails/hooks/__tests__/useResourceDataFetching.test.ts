import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

// REGRESSION (2026-06-27): the project-details Overview fired six resource
// list fetches with `refresh: true` on every mount, forcing a live cloud
// round-trip per resource type just to compute counts (the infra snapshot
// already has them). Against an unhealthy provider that became a storm of
// failing auth calls + error toasts. These fetches must stay cache-first;
// the backend cold-start (`|| ! exists()`) still refreshes an empty cache.

const spies = vi.hoisted(() => ({
  securityGroups: vi.fn(() => ({ data: undefined })),
  subnets: vi.fn(() => ({ data: undefined })),
  igws: vi.fn(() => ({ data: undefined })),
  routeTables: vi.fn(() => ({ data: undefined })),
  elasticIps: vi.fn(() => ({ data: undefined })),
  vpcs: vi.fn(() => ({ data: undefined })),
}));

vi.mock("@/hooks/adminHooks/networkHooks", () => ({
  useFetchNetworks: () => ({ data: undefined }),
  useFetchNetworkInterfaces: () => ({ data: undefined }),
}));
vi.mock("@/shared/hooks/keyPairsHooks", () => ({ useFetchKeyPairs: () => ({ data: undefined }) }));
vi.mock("@/shared/hooks/resources/securityGroupHooks", () => ({
  useFetchSecurityGroups: spies.securityGroups,
}));
vi.mock("@/shared/hooks/resources/subnetHooks", () => ({ useFetchSubnets: spies.subnets }));
vi.mock("@/shared/hooks/resources/igwHooks", () => ({ useFetchIgws: spies.igws }));
vi.mock("@/shared/hooks/resources/routeTableHooks", () => ({ useFetchRouteTables: spies.routeTables }));
vi.mock("@/shared/hooks/resources/eipHooks", () => ({ useFetchElasticIps: spies.elasticIps }));
vi.mock("@/shared/hooks/resources/vpcHooks", () => ({ useFetchVpcs: spies.vpcs }));
vi.mock("@/shared/hooks/vpcInfraHooks", () => ({
  useNatGateways: () => ({ data: undefined }),
  useNetworkAcls: () => ({ data: undefined }),
  useVpcPeering: () => ({ data: undefined }),
}));
vi.mock("@/hooks/adminHooks/loadBalancerHooks", () => ({ useLoadBalancers: () => ({ data: undefined }) }));

import { useResourceDataFetching } from "../useResourceDataFetching";

describe("useResourceDataFetching", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches per-resource counts without forcing a cloud refresh on mount", () => {
    renderHook(() =>
      useResourceDataFetching({
        project: { identifier: "ABC123", region: "uni-ng" },
        infraComponents: {},
        getInfraCount: () => undefined,
      })
    );

    for (const [name, spy] of Object.entries(spies)) {
      expect(spy).toHaveBeenCalled();
      const params = spy.mock.calls[0][0] as { extra?: { refresh?: boolean } };
      // The whole point: no forced refresh on the count fetches.
      expect(params.extra?.refresh, `${name} must not force a refresh`).not.toBe(true);
    }
  });
});
