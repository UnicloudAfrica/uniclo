/**
 * Tests for RefundModal.
 *
 * Asserts the modal submits { id, amount, reason } to useRefundInvoice and
 * refuses to submit when the amount exceeds the invoice's amount_paid.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Invoice } from "@/shared/hooks/resources/invoiceHooks";

const mockMutate = vi.fn();

vi.mock("@/shared/hooks/resources/refundHooks", () => ({
  useRefundInvoice: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock("@/shared/components/ui/PriceLabel", () => ({
  PriceLabel: ({ amount, sourceCurrency }: { amount: number; sourceCurrency: string }) => (
    <span>
      {amount} {sourceCurrency}
    </span>
  ),
}));

import RefundModal from "../RefundModal";

const invoice = {
  uuid: "inv-uuid-1",
  invoice_number: "INV-001",
  amount_paid: 100,
  currency: "NGN",
} as unknown as Invoice;

describe("RefundModal", () => {
  beforeEach(() => mockMutate.mockReset());

  it("submits the entered amount to useRefundInvoice", () => {
    render(<RefundModal invoice={invoice} isOpen onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "40" },
    });
    fireEvent.click(screen.getByRole("button", { name: /issue refund/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      { id: "inv-uuid-1", amount: 40, reason: undefined },
      expect.anything()
    );
  });

  it("does not submit when the amount exceeds the amount paid", () => {
    render(<RefundModal invoice={invoice} isOpen onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "200" },
    });
    fireEvent.click(screen.getByRole("button", { name: /issue refund/i }));

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
