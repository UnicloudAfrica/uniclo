import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import InlinePriceEditor from "../InlinePriceEditor";

/*
 * Behavioural tests, not snapshots. Each test names a contract the
 * component is required to honour — if a future refactor breaks one
 * of these, the failing-test name describes the regression in plain
 * English.
 */

describe("InlinePriceEditor", () => {
  it("renders the persisted value as the input's initial draft", () => {
    render(
      <InlinePriceEditor
        value={42.5}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Test price") as HTMLInputElement;
    expect(input.value).toBe("42.5");
  });

  it("hides the Save button until the user makes the field dirty", async () => {
    const user = userEvent.setup();
    render(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("inline-price-editor-save")).toBeNull();
    await user.clear(screen.getByLabelText("Test price"));
    await user.type(screen.getByLabelText("Test price"), "12");
    expect(screen.getByTestId("inline-price-editor-save")).toBeInTheDocument();
  });

  it("calls onSave with the parsed numeric value when the user presses Enter", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={onSave}
      />,
    );
    const input = screen.getByLabelText("Test price");
    await user.clear(input);
    await user.type(input, "25.50{Enter}");
    expect(onSave).toHaveBeenCalledWith(25.5);
  });

  it("resets the draft to the persisted value when the user presses Escape", async () => {
    const user = userEvent.setup();
    render(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Test price") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "999");
    expect(input.value).toBe("999");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.value).toBe("10");
  });

  it("blocks save and surfaces a role=alert error when the value is below minPrice", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <InlinePriceEditor
        value={50}
        currency="USD"
        minPrice={50}
        ariaLabel="Test price"
        onSave={onSave}
      />,
    );
    const input = screen.getByLabelText("Test price");
    await user.clear(input);
    await user.type(input, "30{Enter}");
    expect(onSave).not.toHaveBeenCalled();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/below/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("sets aria-busy on the container while onSave is in flight", async () => {
    let resolveSave: (() => void) | undefined;
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    const user = userEvent.setup();
    render(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={onSave}
        data-testid="editor"
      />,
    );
    const input = screen.getByLabelText("Test price");
    await user.clear(input);
    await user.type(input, "20{Enter}");
    expect(screen.getByTestId("editor")).toHaveAttribute("aria-busy", "true");
    await act(async () => {
      resolveSave?.();
    });
    expect(screen.getByTestId("editor")).not.toHaveAttribute("aria-busy");
  });

  it("hides the Revert button entirely when no onClear handler is supplied", () => {
    render(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("inline-price-editor-clear")).toBeNull();
  });

  it("disables the Revert button when there's nothing to revert (value is null)", () => {
    render(
      <InlinePriceEditor
        value={null}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByTestId("inline-price-editor-clear")).toBeDisabled();
  });

  it("calls onClear when Revert is clicked, and reflects null after the parent re-props", async () => {
    const onClear = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { rerender } = render(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
        onClear={onClear}
      />,
    );
    await user.click(screen.getByTestId("inline-price-editor-clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
    // Realistic flow: parent invalidates the cache, refetches, and now
    // re-renders with `value=null`. The component should reflect that.
    rerender(
      <InlinePriceEditor
        value={null}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
        onClear={onClear}
      />,
    );
    expect((screen.getByLabelText("Test price") as HTMLInputElement).value).toBe("");
  });

  it("preserves the typed draft when onSave throws, and surfaces the error message", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Network down"));
    const user = userEvent.setup();
    render(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={onSave}
      />,
    );
    const input = screen.getByLabelText("Test price") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "55{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Network down");
    expect(input.value).toBe("55");
  });

  it("renders a skeleton (no input, no buttons) when isLoading is true", () => {
    render(
      <InlinePriceEditor
        value={null}
        currency="USD"
        ariaLabel="Test price"
        isLoading
        onSave={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Test price")).toBeNull();
    expect(screen.queryByTestId("inline-price-editor-save")).toBeNull();
    expect(screen.getByTestId("inline-price-editor-loading")).toHaveAttribute("aria-busy", "true");
  });

  it("doesn't blow away an in-progress edit when the parent re-passes the same value prop", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Test price") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "777");
    rerender(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
      />,
    );
    expect(input.value).toBe("777");
  });

  it("syncs to the new server value once the user is back to a pristine state", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <InlinePriceEditor
        value={10}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Test price") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "20");
    fireEvent.keyDown(input, { key: "Escape" }); // back to pristine
    expect(input.value).toBe("10");
    rerender(
      <InlinePriceEditor
        value={42}
        currency="USD"
        ariaLabel="Test price"
        onSave={vi.fn()}
      />,
    );
    expect(input.value).toBe("42");
  });
});
