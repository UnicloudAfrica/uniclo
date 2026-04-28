import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "../ProgressBar";

describe("ProgressBar", () => {
  it("renders role=progressbar with valid aria attributes", () => {
    render(<ProgressBar value={60} label="Upload" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "60");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps invalid values", () => {
    const { rerender } = render(<ProgressBar value={500} label="x" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    rerender(<ProgressBar value={-10} label="x" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("hides label visually but exposes via aria-label when showLabel=false", () => {
    render(<ProgressBar value={10} label="Hidden" showLabel={false} />);
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Hidden");
  });

  it("ties visible label via aria-labelledby when showLabel=true", () => {
    render(<ProgressBar value={10} label="CPU usage" />);
    const bar = screen.getByRole("progressbar");
    const labelledBy = bar.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const label = document.getElementById(labelledBy ?? "");
    expect(label?.textContent).toContain("CPU usage");
  });
});
