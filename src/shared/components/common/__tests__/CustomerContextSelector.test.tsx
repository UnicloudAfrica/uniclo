import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CustomerContextSelector from "../CustomerContextSelector";

const noop = () => {};

describe("CustomerContextSelector", () => {
  it("renders sub-tenants nested under their parent in the tenant dropdown", () => {
    render(
      <CustomerContextSelector
        contextType="tenant"
        setContextType={noop}
        selectedTenantId=""
        setSelectedTenantId={noop}
        selectedUserId=""
        setSelectedUserId={noop}
        tenants={[
          { id: "1", name: "Acme", parent_id: null },
          { id: "2", name: "Acme Sub", parent_id: "1" },
        ]}
        userPool={[]}
      />,
    );

    const sub = screen.getByRole("option", { name: /Acme Sub/ }) as HTMLOptionElement;
    // The sub-tenant is reachable (right value) and visibly marked as a child.
    expect(sub.value).toBe("2");
    expect(sub.textContent).toContain("└");

    const parent = screen.getByRole("option", { name: /^Acme$/ }) as HTMLOptionElement;
    expect(parent.value).toBe("1");
    expect(parent.textContent).not.toContain("└");
  });
});
