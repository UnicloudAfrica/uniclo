/**
 * Tests for ImportImageModal.
 *
 * Key assertion: the submitted payload uses the `region` prop value as
 * `target_region` rather than any hardcoded string.
 *
 * Written by: ImportImageModal.tsx (URL-import path via api.post).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";

// ─── Mock @/lib/api ───────────────────────────────────────────────────
// vi.mock factories are hoisted to the top of the file, so mockApiPost must
// be declared via vi.hoisted() to be accessible inside the factory.
const { mockApiPost } = vi.hoisted(() => ({ mockApiPost: vi.fn() }));

vi.mock("@/lib/api", () => ({
  api: { post: mockApiPost },
}));

import ImportImageModal from "../ImportImageModal";

// ─── Helpers ──────────────────────────────────────────────────────────

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const BASE_PROPS = {
  open: true,
  onClose: vi.fn(),
  projectIdentifier: "proj-abc-123",
  region: "abuja-1",
};

// ─── Tests ────────────────────────────────────────────────────────────

describe("ImportImageModal", () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockApiPost.mockResolvedValue({ id: "job-1" });
  });

  it("submits target_region from the region prop, not a hardcoded value", async () => {
    renderWithClient(<ImportImageModal {...BASE_PROPS} region="kano-2" />);

    // Fill in required fields (URL tab is default)
    fireEvent.change(screen.getByPlaceholderText("e.g. my-app-server-v3"), {
      target: { value: "my-test-image" },
    });
    fireEvent.change(screen.getByPlaceholderText(/server\.qcow2/), {
      target: { value: "https://example.com/image.qcow2" },
    });

    fireEvent.click(screen.getByRole("button", { name: /queue import/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledOnce());

    const [, payload] = mockApiPost.mock.calls[0];
    expect(payload).toMatchObject({ target_region: "kano-2" });
    // Guard: ensure the old hardcoded value is not present
    expect(payload.target_region).not.toBe("lagos-1");
  });

  it("uses whichever region prop value is passed in", async () => {
    renderWithClient(<ImportImageModal {...BASE_PROPS} region="abuja-1" />);

    fireEvent.change(screen.getByPlaceholderText("e.g. my-app-server-v3"), {
      target: { value: "another-image" },
    });
    fireEvent.change(screen.getByPlaceholderText(/server\.qcow2/), {
      target: { value: "https://example.com/other.qcow2" },
    });

    fireEvent.click(screen.getByRole("button", { name: /queue import/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledOnce());

    const [, payload] = mockApiPost.mock.calls[0];
    expect(payload).toMatchObject({ target_region: "abuja-1" });
  });
});
