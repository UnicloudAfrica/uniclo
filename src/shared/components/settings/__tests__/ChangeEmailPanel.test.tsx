/**
 * Tests for the Change Email panel in AccountSettingsContent.
 *
 * Covers the two-step OTP flow:
 *   1. request — POST profile/email  { email, current_password }
 *   2. verify  — POST profile/email/verify  { otp, code, google2fa_code }
 * plus client-side validation guards. The context-aware `api` client is
 * controlled by mocking detectApiContext from @/hooks/settingsHooks.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";

// ── Mocks ────────────────────────────────────────────────────────────

// vi.mock factories are hoisted above declarations, so build shared mock
// state via vi.hoisted to keep it accessible inside the factories.
const { mockApi, toast } = vi.hoisted(() => ({
  mockApi: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    toast: vi.fn(),
  },
}));

// Control the context-aware HTTP client used via detectApiContext().
vi.mock("@/hooks/settingsHooks", () => ({
  detectApiContext: () => ({ api: mockApi, type: "client" }),
}));

// Capture toast calls so we can assert success/validation messaging.
vi.mock("@/utils/toastUtil", () => ({ default: toast }));

// Import AFTER mocks are registered.
import { ChangeEmailPanel } from "../AccountSettingsContent";

// ── Helpers ──────────────────────────────────────────────────────────

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const getEmailInput = () => screen.getByPlaceholderText("mail@company.com");
const getPasswordInput = () => screen.getByPlaceholderText("••••••••");

// ── Tests ─────────────────────────────────────────────────────────────

describe("ChangeEmailPanel", () => {
  beforeEach(() => {
    mockApi.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    toast.warning.mockReset();
  });

  it("renders the request step with email + password inputs", () => {
    renderWithClient(<ChangeEmailPanel />);
    expect(screen.getByText("Change Email")).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
  });

  it("warns and does not call the API when the email is invalid", async () => {
    renderWithClient(<ChangeEmailPanel />);
    fireEvent.change(getEmailInput(), { target: { value: "not-an-email" } });
    fireEvent.change(getPasswordInput(), { target: { value: "secret123" } });

    // Submit button is disabled for invalid email, so submit the form directly.
    const form = getEmailInput().closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => expect(toast.warning).toHaveBeenCalled());
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("requests a code, then verifies, hitting both endpoints with the OTP aliases", async () => {
    mockApi.mockResolvedValue({ data: {} });
    renderWithClient(<ChangeEmailPanel />);

    // Step 1 — request the change.
    fireEvent.change(getEmailInput(), { target: { value: "new@company.com" } });
    fireEvent.change(getPasswordInput(), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /send verification code/i }));

    await waitFor(() =>
      expect(mockApi).toHaveBeenCalledWith("POST", "profile/email", {
        email: "new@company.com",
        current_password: "secret123",
      })
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    // Step 2 — the verify form is now shown.
    const otpInput = await screen.findByPlaceholderText("Enter 6-digit code");
    fireEvent.change(otpInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify & update email/i }));

    await waitFor(() =>
      expect(mockApi).toHaveBeenCalledWith("POST", "profile/email/verify", {
        otp: "123456",
        code: "123456",
        google2fa_code: "123456",
      })
    );
  });

  it("shows an error toast when the request endpoint fails", async () => {
    mockApi.mockRejectedValue(new Error("Email already in use"));
    renderWithClient(<ChangeEmailPanel />);

    fireEvent.change(getEmailInput(), { target: { value: "new@company.com" } });
    fireEvent.change(getPasswordInput(), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /send verification code/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Email already in use"));
    // Should remain on the request step (no OTP input rendered).
    expect(screen.queryByPlaceholderText("Enter 6-digit code")).not.toBeInTheDocument();
  });
});
