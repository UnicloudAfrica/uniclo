import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useProjectProvisioning } from "../useProjectProvisioning";

// The SUT composes the admin network-status fetching hook, which bottoms out
// in router/api context — mock it like the sibling useResourceDataFetching
// test does, so the hook under test renders without a Router.
vi.mock("@/hooks/adminHooks/projectHooks", () => ({
  useProjectNetworkStatus: () => ({ data: undefined, refetch: vi.fn() }),
}));

/**
 * When the provisioning pipeline completes, the panels around it read from
 * queries the completion effect historically never invalidated — the
 * server-side infrastructure snapshot, the edge config, and several
 * per-resource lists — so they lagged a completed pipeline by a staleness
 * window. This pins the full invalidation set on the provisioning→active
 * transition.
 */
const COMPLETION_KEYS = [
  ["project-infrastructure-status"],
  ["admin-project-edge-config"],
  ["routeTables"],
  ["elasticIps"],
  ["keyPairs"],
  ["networkInterfaces"],
];

const makeProject = (status: string): Record<string, unknown> => ({
  status,
  provisioning_progress: [],
});

function setup(initialStatus: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  const invalidateSpy = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  const baseParams = {
    projectId: "p1",
    resolvedProjectId: "p1",
    isNewProject: false,
    refetchProjectStatus: vi.fn(),
    refetchProjectDetails: vi.fn(),
  };

  const rendered = renderHook(
    ({ project }: { project: Record<string, unknown> }) =>
      useProjectProvisioning({ ...baseParams, project }),
    { wrapper, initialProps: { project: makeProject(initialStatus) } }
  );

  return { ...rendered, invalidateSpy };
}

const invalidatedKeys = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls.map(([args]) =>
    JSON.stringify((args as { queryKey: unknown } | undefined)?.queryKey)
  );

describe("useProjectProvisioning completion invalidations", () => {
  it("invalidates the infra snapshot, edge config and per-resource keys on provisioning → active", () => {
    const { rerender, invalidateSpy } = setup("provisioning");

    invalidateSpy.mockClear();
    rerender({ project: makeProject("active") });

    const keys = invalidatedKeys(invalidateSpy);
    for (const key of COMPLETION_KEYS) {
      expect(keys).toContain(JSON.stringify(key));
    }
  });

  it("does not fire the completion invalidations while still provisioning", () => {
    const { rerender, invalidateSpy } = setup("provisioning");

    invalidateSpy.mockClear();
    rerender({ project: makeProject("provisioning") });

    const keys = invalidatedKeys(invalidateSpy);
    expect(keys).not.toContain(JSON.stringify(["project-infrastructure-status"]));
    expect(keys).not.toContain(JSON.stringify(["admin-project-edge-config"]));
  });
});
