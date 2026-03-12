import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectProvisioning } from "./useProjectProvisioning";

const { refetchNetworkStatus } = vi.hoisted(() => ({
  refetchNetworkStatus: vi.fn(),
}));

vi.mock("@/hooks/adminHooks/projectHooks", () => ({
  useProjectNetworkStatus: () => ({
    data: undefined,
    refetch: refetchNetworkStatus,
  }),
}));

vi.mock("@/utils/logger", () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useProjectProvisioning", () => {
  beforeEach(() => {
    refetchNetworkStatus.mockReset();
    window.history.pushState({}, "", "/admin-dashboard/projects/details");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exits provisioning mode after completion without re-entering on a stale provisioning status", () => {
    const wrapper = createWrapper();

    const { result, rerender } = renderHook(
      (props: Parameters<typeof useProjectProvisioning>[0]) => useProjectProvisioning(props),
      {
        wrapper,
        initialProps: {
          project: {
            status: "provisioning",
            provisioning_progress: [{ id: "1", label: "Workspace", status: "completed" }],
          },
          projectId: "B8F7E3",
          resolvedProjectId: "B8F7E3",
          isNewProject: false,
          refetchProjectStatus: vi.fn(),
          refetchProjectDetails: vi.fn(),
        },
      }
    );

    expect(result.current.isInProvisioningMode).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isInProvisioningMode).toBe(false);

    rerender({
      project: {
        status: "provisioning",
        provisioning_progress: [{ id: "1", label: "Workspace", status: "completed" }],
      },
      projectId: "B8F7E3",
      resolvedProjectId: "B8F7E3",
      isNewProject: false,
      refetchProjectStatus: vi.fn(),
      refetchProjectDetails: vi.fn(),
    });

    expect(result.current.isInProvisioningMode).toBe(false);
  });

  it("consumes the new project flow after setup completes", () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const wrapper = createWrapper();

    window.history.pushState(
      {},
      "",
      "/admin-dashboard/projects/details?identifier=B8F7E3&new=true"
    );

    const { result } = renderHook(
      () =>
        useProjectProvisioning({
          project: {
            status: "ready",
            provisioning_progress: [{ id: "1", label: "Workspace", status: "completed" }],
          },
          projectId: "B8F7E3",
          resolvedProjectId: "B8F7E3",
          isNewProject: true,
          refetchProjectStatus: vi.fn(),
          refetchProjectDetails: vi.fn(),
        }),
      { wrapper }
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isInProvisioningMode).toBe(false);
    expect(replaceStateSpy).toHaveBeenCalledOnce();
    expect(window.location.search).not.toContain("new=true");
  });
});
