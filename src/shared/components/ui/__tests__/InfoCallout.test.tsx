import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InfoCallout from "../InfoCallout";

describe("InfoCallout", () => {
  it("uses role=status and aria-live=polite by default", () => {
    render(<InfoCallout>hello</InfoCallout>);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-live", "polite");
  });

  it("uses role=alert for danger tone (assertive)", () => {
    render(<InfoCallout tone="danger">boom</InfoCallout>);
    const el = screen.getByRole("alert");
    expect(el).toHaveAttribute("aria-live", "assertive");
  });

  it("renders title + body + actions", () => {
    render(
      <InfoCallout
        tone="warning"
        title="Heads up"
        actions={<button>Dismiss</button>}
      >
        Trial expires soon.
      </InfoCallout>
    );
    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("Trial expires soon.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });
});
