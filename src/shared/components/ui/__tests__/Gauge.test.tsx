import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Gauge from "../Gauge";

describe("Gauge", () => {
  it("exposes role=meter with aria-valuenow/min/max", () => {
    render(<Gauge value={42} label="CPU" />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "42");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps values outside 0-100", () => {
    const { rerender } = render(<Gauge value={150} label="CPU" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "100");

    rerender(<Gauge value={-5} label="CPU" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");

    rerender(<Gauge value={Number.NaN} label="CPU" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");
  });

  it("uses displayValue as aria-valuetext when provided", () => {
    render(<Gauge value={75} label="Nodes" displayValue="3/4 nodes" />);
    expect(screen.getByRole("meter")).toHaveAttribute(
      "aria-valuetext",
      "3/4 nodes"
    );
  });

  it("ties the visual <title> to the meter via aria-labelledby", () => {
    render(<Gauge value={10} label="Memory" />);
    const meter = screen.getByRole("meter");
    const labelledBy = meter.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const title = meter.querySelector("title");
    expect(title?.id).toBe(labelledBy);
    expect(title?.textContent).toBe("Memory");
  });
});
