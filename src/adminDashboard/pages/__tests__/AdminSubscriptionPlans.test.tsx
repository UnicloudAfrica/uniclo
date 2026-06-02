import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/*
 * Covers the SubscriptionPlanModal submit path: that filling the form and
 * clicking the primary action posts the correct payload to the create hook
 * (create mode) and the { id, data } shape to the update hook (edit mode).
 *
 * The CRUD hooks are mocked so the test exercises the modal's payload
 * assembly + submit wiring without standing up the real API client /
 * router that `createResourceHooks` -> `useApiContext` would require.
 */

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/shared/hooks/resources/subscriptionPlanHooks", () => ({
  useCreateSubscriptionPlan: () => ({ mutateAsync: mockCreate }),
  useUpdateSubscriptionPlan: () => ({ mutateAsync: mockUpdate }),
}));

import SubscriptionPlanModal from "../../components/SubscriptionPlanModal";

const fillNumber = (label: RegExp, value: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

describe("SubscriptionPlanModal — submit", () => {
  beforeEach(() => {
    mockCreate.mockReset().mockResolvedValue({ id: 1 });
    mockUpdate.mockReset().mockResolvedValue({ id: 1 });
  });

  it("creates a plan with the assembled payload", async () => {
    const onClose = vi.fn();
    render(<SubscriptionPlanModal isOpen onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/plan name/i), {
      target: { value: "Starter" },
    });
    fillNumber(/base price/i, "5000");
    fillNumber(/max instances/i, "3");

    fireEvent.click(screen.getByRole("button", { name: /create plan/i }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Starter",
        base_price: 5000,
        currency: "NGN",
        billing_interval: "monthly",
        billing_interval_count: 1,
        max_instances: 3,
        // untouched optional numeric fields are sent as null
        max_vcpus: null,
        is_active: true,
        is_public: false,
      })
    );
    expect(mockUpdate).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("blocks submit and shows an error when name is empty", async () => {
    render(<SubscriptionPlanModal isOpen onClose={vi.fn()} />);

    fillNumber(/base price/i, "100");
    fireEvent.click(screen.getByRole("button", { name: /create plan/i }));

    expect(await screen.findByText(/plan name is required/i)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("updates via PUT-shaped { id, data } payload in edit mode", async () => {
    const onSaved = vi.fn();
    render(
      <SubscriptionPlanModal
        isOpen
        onClose={vi.fn()}
        onSaved={onSaved}
        plan={{
          id: 42,
          name: "Pro",
          base_price: 12000,
          currency: "USD",
          billing_interval: "yearly",
          is_active: true,
          is_public: true,
        }}
      />
    );

    // Prefilled from the plan prop.
    expect(screen.getByLabelText(/plan name/i)).toHaveValue("Pro");

    fireEvent.change(screen.getByLabelText(/plan name/i), {
      target: { value: "Pro Plus" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));

    expect(mockUpdate).toHaveBeenCalledWith({
      id: 42,
      data: expect.objectContaining({
        name: "Pro Plus",
        base_price: 12000,
        currency: "USD",
        billing_interval: "yearly",
      }),
    });
    expect(mockCreate).not.toHaveBeenCalled();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});
