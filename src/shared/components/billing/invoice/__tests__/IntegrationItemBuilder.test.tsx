/**
 * IntegrationItemBuilder — the generic integration-product picker for the
 * quote/invoice wizard. Verifies it builds a correct line item from the
 * selected product and surfaces the bucket-size field for surcharge products.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IntegrationItemBuilder from "../IntegrationItemBuilder";
import type { IntegrationProductRow } from "@/shared/hooks/resources/integrationProductHooks";

const products: IntegrationProductRow[] = [
  {
    id: 1,
    integration_key: "shield",
    service_type: "ddos",
    name: "DDoS Shield",
    description: null,
    billing_model: "monthly_flat",
    unit_label: "per domain",
    provider: null,
    region: null,
    pricing_tiers: null,
    pricing_id: 10,
    price: 50,
    currency_code: "USD",
  },
  {
    id: 2,
    integration_key: "anycloudflow",
    service_type: "replication",
    name: "VM Replication",
    description: null,
    billing_model: "monthly_flat",
    unit_label: "per VM",
    provider: null,
    region: null,
    pricing_tiers: { surcharge_threshold_gb: 1000, size_surcharge_per_gb_month_cents: 10 },
    pricing_id: 11,
    price: 20,
    currency_code: "USD",
  },
];

describe("IntegrationItemBuilder", () => {
  it("builds an integration line item from the selected product", () => {
    const onAdd = vi.fn();
    render(<IntegrationItemBuilder products={products} isFetching={false} onAdd={onAdd} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });

    // Number inputs in render order: [Quantity, Months].
    const [quantity, months] = screen.getAllByRole("spinbutton");
    fireEvent.change(quantity, { target: { value: "3" } });
    fireEvent.change(months, { target: { value: "6" } });

    fireEvent.click(screen.getByRole("button", { name: /add to invoice/i }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        integration_product_id: 1,
        quantity: 3,
        months: 6,
        _display: expect.objectContaining({ name: "DDoS Shield" }),
      })
    );
  });

  it("shows a bucket-size field for surcharge products and includes it in the item", () => {
    const onAdd = vi.fn();
    render(<IntegrationItemBuilder products={products} isFetching={false} onAdd={onAdd} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });

    // Now three number inputs: [Quantity, Months, Bucket size].
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(3);
    fireEvent.change(inputs[2], { target: { value: "1500" } });

    fireEvent.click(screen.getByRole("button", { name: /add to invoice/i }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        integration_product_id: 2,
        bucket_size_gb: 1500,
      })
    );
  });

  it("does not fire onAdd when no product is selected", () => {
    const onAdd = vi.fn();
    render(<IntegrationItemBuilder products={products} isFetching={false} onAdd={onAdd} />);

    fireEvent.click(screen.getByRole("button", { name: /add to invoice/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });
});
