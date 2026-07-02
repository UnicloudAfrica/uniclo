import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useInstanceLogs,
  useInstanceUsageStats,
  useBackupPurchasePreview,
  useBackupPurchaseConfirm,
} from "../instanceHooks";

const { silentApiGet, silentApiPost } = vi.hoisted(() => ({
  silentApiGet: vi.fn(),
  silentApiPost: vi.fn(),
}));

vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({ context: "admin" }),
}));

vi.mock("@/shared/api/apiRegistry", () => ({
  apiRegistry: {
    admin: {
      urlPrefix: "",
      silentApi: {
        get: (path: string) => silentApiGet(path),
        post: (path: string, body: unknown) => silentApiPost(path, body),
      },
    },
  },
}));

vi.mock("../../api/apiRegistry", () => ({
  apiRegistry: {
    admin: {
      urlPrefix: "",
      silentApi: {
        get: (path: string) => silentApiGet(path),
        post: (path: string, body: unknown) => silentApiPost(path, body),
      },
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe("useInstanceLogs", () => {
  beforeEach(() => {
    silentApiGet.mockReset();
  });

  it("calls the logs endpoint and unwraps the envelope (lines key)", async () => {
    silentApiGet.mockResolvedValue({
      success: true,
      data: { lines: ["boot ok", "ready"], total_lines: 2, last_updated: "2026-06-29T00:00:00Z" },
    });

    let data: unknown;
    const Probe = () => {
      const q = useInstanceLogs("inst-123", { lines: 200 });
      data = q.data;
      return null;
    };
    render(<Probe />, { wrapper });

    await waitFor(() => {
      expect(silentApiGet).toHaveBeenCalledWith("/cube-instance/inst-123/logs?lines=200");
      expect((data as { lines: string[] }).lines).toEqual(["boot ok", "ready"]);
    });
  });

  it("does not fetch when identifier is null", () => {
    const Probe = () => {
      useInstanceLogs(null);
      return null;
    };
    render(<Probe />, { wrapper });

    expect(silentApiGet).not.toHaveBeenCalled();
  });
});

describe("useInstanceUsageStats", () => {
  beforeEach(() => {
    silentApiGet.mockReset();
  });

  it("calls the usage-stats endpoint with period and unwraps the envelope", async () => {
    silentApiGet.mockResolvedValue({
      success: true,
      data: {
        period: "7d",
        cpu_average: 12,
        memory_average: 512,
        network_in: 3,
        network_out: 4,
        disk_read: 5,
        disk_write: 6,
      },
    });

    let data: unknown;
    const Probe = () => {
      const q = useInstanceUsageStats("inst-123", "7d");
      data = q.data;
      return null;
    };
    render(<Probe />, { wrapper });

    await waitFor(() => {
      expect(silentApiGet).toHaveBeenCalledWith("/cube-instance/inst-123/usage-stats?period=7d");
      expect((data as { period: string }).period).toBe("7d");
    });
  });
});

describe("useBackupPurchasePreview", () => {
  beforeEach(() => {
    silentApiGet.mockReset();
  });

  it("calls the purchase-preview endpoint and unwraps the quote", async () => {
    silentApiGet.mockResolvedValue({
      success: true,
      data: {
        plan: "backup_only",
        monthly_fee: 500,
        prorated_amount: 250,
        currency: "USD",
        sufficient_funds: true,
      },
    });

    let data: unknown;
    const Probe = () => {
      const q = useBackupPurchasePreview("inst-9", { enabled: true });
      data = q.data;
      return null;
    };
    render(<Probe />, { wrapper });

    await waitFor(() => {
      expect(silentApiGet).toHaveBeenCalledWith(
        "/cube-instance/inst-9/protection/backup/purchase-preview"
      );
      expect((data as { prorated_amount: number }).prorated_amount).toBe(250);
    });
  });

  it("does not fetch while the wizard is closed (disabled)", () => {
    const Probe = () => {
      useBackupPurchasePreview("inst-9", { enabled: false });
      return null;
    };
    render(<Probe />, { wrapper });

    expect(silentApiGet).not.toHaveBeenCalled();
  });
});

describe("useBackupPurchaseConfirm", () => {
  beforeEach(() => {
    silentApiPost.mockReset();
  });

  it("posts the accepted_amount price-lock to the purchase endpoint", async () => {
    silentApiPost.mockResolvedValue({
      success: true,
      data: { configured: true, enabled: true },
    });

    let mutateAsync:
      | ((v: { identifier: string; acceptedAmount: number }) => Promise<unknown>)
      | undefined;
    const Probe = () => {
      const m = useBackupPurchaseConfirm();
      mutateAsync = m.mutateAsync;
      return null;
    };
    render(<Probe />, { wrapper });

    await waitFor(() => expect(mutateAsync).toBeDefined());
    await mutateAsync!({ identifier: "inst-9", acceptedAmount: 250 });

    expect(silentApiPost).toHaveBeenCalledWith(
      "/cube-instance/inst-9/protection/backup/purchase",
      { accepted_amount: 250 }
    );
  });

  it("propagates a 409 price-drift error to the caller (re-quote path)", async () => {
    silentApiPost.mockRejectedValue(Object.assign(new Error("drift"), { status: 409 }));

    let mutateAsync:
      | ((v: { identifier: string; acceptedAmount: number }) => Promise<unknown>)
      | undefined;
    const Probe = () => {
      const m = useBackupPurchaseConfirm();
      mutateAsync = m.mutateAsync;
      return null;
    };
    render(<Probe />, { wrapper });

    await waitFor(() => expect(mutateAsync).toBeDefined());

    await expect(mutateAsync!({ identifier: "inst-9", acceptedAmount: 250 })).rejects.toMatchObject({
      status: 409,
    });
  });
});
