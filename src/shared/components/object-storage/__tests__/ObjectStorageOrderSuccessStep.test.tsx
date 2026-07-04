import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ObjectStorageOrderSuccessStep } from "../ObjectStorageOrderSuccessStep";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const fetchAccountMock = vi.fn();
vi.mock("@/services/objectStorageApi", () => ({
  default: { fetchAccount: (id: string) => fetchAccountMock(id) },
}));

// Realtime subscription is a side-effect only; no-op it in tests.
vi.mock("@/hooks/useObjectStorageBroadcasting", () => ({
  useObjectStorageBroadcasting: () => undefined,
}));

const ACCOUNT_ID = "20afbfd2-d10b-49fc-908c-622bde9d4fd4";

describe("ObjectStorageOrderSuccessStep", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    fetchAccountMock.mockReset();
    // Account still provisioning: no completed access_key/finalize steps.
    fetchAccountMock.mockResolvedValue({
      id: ACCOUNT_ID,
      name: "Demo Storage",
      status: "provisioning",
      meta: { provisioning_progress: [] },
    });
  });

  it("navigates to the account detail page while still provisioning", async () => {
    render(
      <MemoryRouter>
        <ObjectStorageOrderSuccessStep
          accountIds={[ACCOUNT_ID]}
          orderId="01KWGGBQ9WCB9AAKBWEZ5DYDJ8"
          transactionId="01KWGGBQAQ417XFV5KX0B7SA8R"
          isFastTrack
          dashboardContext="admin"
        />
      </MemoryRouter>
    );

    const button = await screen.findByRole("button", { name: /view storage account/i });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(`/admin-dashboard/object-storage/${ACCOUNT_ID}`)
    );
  });
});
