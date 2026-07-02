import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OrderSuccessStep from "../OrderSuccessStep";

/*
 * After provisioning, the success step's primary button should deep-link to a
 * single newly-created instance's details page (resolved by `identifier`),
 * and fall back to the instance list when more than one instance was created.
 */

vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({
    context: "admin",
    apiBaseUrl: "http://localhost",
    authHeaders: {},
    isAuthenticated: false,
  }),
}));

vi.mock("@/hooks/useInstanceBroadcasting", () => ({
  useInstanceBroadcasting: () => undefined,
}));

const renderSuccess = (instances: unknown) =>
  render(
    <OrderSuccessStep
      orderId="ORD-1"
      configurationSummaries={[]}
      instances={instances}
      instancesPageUrl="/admin-dashboard/cube-instances"
      instanceDetailsUrl="/admin-dashboard/cube-instances/details"
      onCreateAnother={() => undefined}
      resourceLabel="Cube-Instance"
    />
  );

describe("OrderSuccessStep primary action", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.window, "location", {
      configurable: true,
      value: { href: "" },
    });
  });

  it("deep-links to the instance details page (by identifier) for a single instance", () => {
    renderSuccess([{ id: 42, identifier: "abc-123" }]);

    const button = screen.getByRole("button", { name: "View Instance" });
    fireEvent.click(button);

    expect(globalThis.window.location.href).toBe(
      "/admin-dashboard/cube-instances/details?identifier=abc-123"
    );
  });

  it("falls back to the instance list when more than one instance was created", () => {
    renderSuccess([
      { id: 1, identifier: "abc-1" },
      { id: 2, identifier: "abc-2" },
    ]);

    const button = screen.getByRole("button", { name: "View My Instances" });
    fireEvent.click(button);

    expect(globalThis.window.location.href).toBe("/admin-dashboard/cube-instances");
  });
});
