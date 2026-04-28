import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatTile from "../StatTile";
import KpiTile from "../KpiTile";

describe("StatTile", () => {
  it("renders label + numeric value, exposed as a labelled group", () => {
    render(<StatTile label="VMs" value={42} />);
    // aria-labelledby joins label + value with a space — accessible name is "VMs 42"
    const group = screen.getByRole("group", { name: /VMs.*42/i });
    expect(group).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<StatTile label="VMs" value={42} loading />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText("42")).not.toBeInTheDocument();
  });

  it("hides hint when loading", () => {
    render(<StatTile label="x" value={1} hint="extra" loading />);
    expect(screen.queryByText("extra")).not.toBeInTheDocument();
  });
});

describe("KpiTile", () => {
  it("renders label + value as group", () => {
    render(<KpiTile label="Regions" value={7} />);
    expect(screen.getByRole("group", { name: /Regions.*7/i })).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<KpiTile label="Regions" value={7} loading />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
