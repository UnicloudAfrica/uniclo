import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SurfaceCard from "../SurfaceCard";

describe("SurfaceCard interactive promotion", () => {
  it("auto-promotes a div with onClick to ARIA button (role + tabIndex + key activation)", () => {
    const onClick = vi.fn();
    render(
      <SurfaceCard onClick={onClick} data-testid="card">
        click me
      </SurfaceCard>
    );
    const el = screen.getByTestId("card");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveAttribute("role", "button");
    expect(el).toHaveAttribute("tabIndex", "0");

    // Enter activates
    fireEvent.keyDown(el, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);

    // Space activates
    fireEvent.keyDown(el, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(2);

    // Click still works
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("does not promote when there is no onClick", () => {
    render(
      <SurfaceCard data-testid="card">
        plain
      </SurfaceCard>
    );
    const el = screen.getByTestId("card");
    expect(el).not.toHaveAttribute("role");
    expect(el).not.toHaveAttribute("tabIndex");
  });

  it("respects an explicit role override", () => {
    render(
      <SurfaceCard onClick={() => {}} role="link" data-testid="card">
        x
      </SurfaceCard>
    );
    expect(screen.getByTestId("card")).toHaveAttribute("role", "link");
  });

  it("renders disabled button-mode card with reduced opacity classes", () => {
    render(
      <SurfaceCard as="button" disabled data-testid="card">
        x
      </SurfaceCard>
    );
    const btn = screen.getByTestId("card") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.className).toMatch(/opacity-60/);
  });

  it("anchor mode with disabled blocks default click and sets aria-disabled", () => {
    const onClick = vi.fn();
    render(
      <SurfaceCard as="a" href="/x" disabled onClick={onClick} data-testid="card">
        link
      </SurfaceCard>
    );
    const a = screen.getByTestId("card") as HTMLAnchorElement;
    expect(a).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(a);
    expect(onClick).not.toHaveBeenCalled();
  });
});
