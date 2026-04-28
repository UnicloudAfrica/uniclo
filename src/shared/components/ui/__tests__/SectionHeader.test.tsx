import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SectionHeader from "../SectionHeader";

describe("SectionHeader", () => {
  it("renders the title as the configured heading level", () => {
    render(<SectionHeader title="Regions" as="h3" />);
    expect(screen.getByRole("heading", { level: 3, name: /Regions/i })).toBeInTheDocument();
  });

  it("appends a count badge with aria-label for screen readers", () => {
    render(<SectionHeader title="VMs" count={1247} />);
    const badge = screen.getByLabelText("1247 items");
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain("(1,247)");
  });

  it("singularises the count aria-label when count is 1", () => {
    render(<SectionHeader title="VM" count={1} />);
    expect(screen.getByLabelText("1 item")).toBeInTheDocument();
  });

  it("renders description and trailing actions", () => {
    render(
      <SectionHeader
        title="Open alarms"
        description="Across all regions"
        actions={<button>Filter</button>}
      />
    );
    expect(screen.getByText("Across all regions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
  });
});
