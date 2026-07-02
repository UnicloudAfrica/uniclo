/**
 * Hook-level test for `useFetchSubTenantByTenantID` (GAP-213).
 *
 * The partner "Clients" table (PartnerClients.tsx) renders the rows this
 * hook returns. The bug: the hook used to return `res.message` (a string),
 * so the consumer's `Array.isArray(...)` guard always fell through to `[]`
 * and the table was permanently empty.
 *
 * The backend route `GET admin/v1/tenant-clients/{tenant_client}` returns
 * the rows at `res.data`. This test mocks the admin `silentApi` client so it
 * exercises the REAL envelope→rows mapping: given `{ message, data: [...] }`
 * the hook must resolve the `data` array, not the message.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mockSilentApi = vi.fn();

// Match the SUT's import specifier (`../../index/admin/silent`) — resolved
// relative to THIS file it is `../../../index/admin/silent`. There is no
// `@/index` alias, so the relative form is required (see web/CLAUDE.md).
vi.mock("../../../index/admin/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));

import { useFetchSubTenantByTenantID } from "../tenantHooks";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

beforeEach(() => mockSilentApi.mockReset());

describe("useFetchSubTenantByTenantID", () => {
  it("GETs /tenant-clients/{id} and returns the rows from res.data", async () => {
    const rows = [
      { id: 1, identifier: "cl-1", name: "Acme Ltd", email: "ops@acme.test" },
      { id: 2, identifier: "cl-2", name: "Globex", email: "it@globex.test" },
    ];
    // Envelope mirrors the BE response: a `message` string alongside the
    // rows at `data`. The hook must read `data`, never `message`.
    mockSilentApi.mockResolvedValue({ message: "Tenant clients retrieved", data: rows });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFetchSubTenantByTenantID("t-42"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith("GET", "/tenant-clients/t-42");
    expect(result.current.data).toEqual(rows);
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("resolves to an empty array when the envelope has no data rows", async () => {
    mockSilentApi.mockResolvedValue({ message: "No clients" });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFetchSubTenantByTenantID("t-7"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
