import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectableCardGroup, { type SelectableCardOption } from "../SelectableCardGroup";

type Id = "gmail" | "outlook" | "yahoo" | "other";

const OPTIONS: SelectableCardOption<Id>[] = [
  { value: "gmail", label: "Gmail", icon: "📧", description: "Google mail" },
  { value: "outlook", label: "Outlook", icon: "📨" },
  { value: "yahoo", label: "Yahoo", icon: "💜", disabled: true },
  { value: "other", label: "Other / my own server", icon: "⚙️" },
];

/** Controlled harness so selection actually updates aria-checked. */
function Harness({
  onChange = () => {},
  initial = null,
}: {
  onChange?: (v: Id) => void;
  initial?: Id | null;
}) {
  const [value, setValue] = useState<Id | null>(initial);
  return (
    <SelectableCardGroup<Id>
      ariaLabel="Which email service is this?"
      options={OPTIONS}
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe("SelectableCardGroup", () => {
  it("renders a radiogroup with one radio per option and an accessible name", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup", { name: "Which email service is this?" });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("selects on click and reflects aria-checked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    const gmail = screen.getByRole("radio", { name: /Gmail/ });
    expect(gmail).toHaveAttribute("aria-checked", "false");

    await user.click(gmail);

    expect(onChange).toHaveBeenCalledWith("gmail");
    expect(screen.getByRole("radio", { name: /Gmail/ })).toHaveAttribute("aria-checked", "true");
  });

  it("moves selection with ArrowRight and skips disabled options", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} initial="gmail" />);

    // Focus the selected card, then arrow right twice: gmail -> outlook -> (skip yahoo) -> other
    await user.click(screen.getByRole("radio", { name: /Gmail/ }));
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("outlook");

    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("other"); // yahoo (disabled) skipped
  });

  it("wraps from the last option back to the first enabled with ArrowRight", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} initial="other" />);

    await user.click(screen.getByRole("radio", { name: /Other/ }));
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("gmail");
  });

  it("does not select a disabled option on click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    const yahoo = screen.getByRole("radio", { name: /Yahoo/ });
    expect(yahoo).toBeDisabled();
    await user.click(yahoo);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses roving tabindex — exactly one card is in the tab order", () => {
    render(<Harness initial="outlook" />);
    const radios = screen.getAllByRole("radio");
    const tabbable = radios.filter((r) => r.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName(/Outlook/);
  });

  it("renders skeleton tiles and no radios while loading", () => {
    render(
      <SelectableCardGroup<Id>
        ariaLabel="loading"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        loading
        skeletonCount={3}
      />,
    );
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });
});
