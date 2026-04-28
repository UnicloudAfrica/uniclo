import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SurfaceCard from "../SurfaceCard";

describe("SurfaceCard", () => {
  it("renders a div by default with the card variant class", () => {
    render(
      <SurfaceCard data-testid="card">
        <p>hello</p>
      </SurfaceCard>
    );
    const el = screen.getByTestId("card");
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("db-surface-card");
    expect(el.className).toContain("p-4");
    expect(el.className).toContain("rounded-xl");
  });

  it("applies the requested variant", () => {
    render(
      <SurfaceCard variant="signal-panel" data-testid="card">
        <p>x</p>
      </SurfaceCard>
    );
    expect(screen.getByTestId("card").className).toContain("db-signal-panel");
  });

  it("renders as a button when as=\"button\" with default type=button", () => {
    const onClick = vi.fn();
    render(
      <SurfaceCard as="button" onClick={onClick} data-testid="card">
        click me
      </SurfaceCard>
    );
    const btn = screen.getByTestId("card") as HTMLButtonElement;
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.type).toBe("button");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("adds focus-ring + hover classes when interactive", () => {
    render(
      <SurfaceCard as="button" data-testid="card">
        x
      </SurfaceCard>
    );
    const el = screen.getByTestId("card");
    expect(el.className).toMatch(/focus-visible:ring/);
    expect(el.className).toMatch(/hover:shadow/);
  });

  it("renders as an anchor with href when as=\"a\"", () => {
    render(
      <SurfaceCard as="a" href="/x" data-testid="card">
        link
      </SurfaceCard>
    );
    const a = screen.getByTestId("card") as HTMLAnchorElement;
    expect(a.tagName).toBe("A");
    expect(a.getAttribute("href")).toBe("/x");
  });
});
