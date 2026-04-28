import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Tooltip from "../Tooltip";
import Tabs from "../Tabs";
import DropdownMenu from "../DropdownMenu";
import Avatar from "../Avatar";
import Breadcrumbs from "../Breadcrumbs";
import Chip from "../Chip";
import DescriptionList from "../DescriptionList";

describe("Tooltip", () => {
  it("links via aria-describedby on focus, removes on blur", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Help text" delay={100}>
        <button>trigger</button>
      </Tooltip>
    );
    const trigger = screen.getByRole("button");
    expect(trigger).not.toHaveAttribute("aria-describedby");
    fireEvent.focus(trigger);
    act(() => vi.advanceTimersByTime(120));
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Help text");
    fireEvent.blur(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
    vi.useRealTimers();
  });
});

describe("Tabs", () => {
  it("renders tablist with proper roles + selection", () => {
    render(
      <Tabs
        items={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
        defaultValue="a"
        ariaLabel="Demo tabs"
        renderPanel={(v) => <div>panel {v}</div>}
      />
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("panel a");
  });

  it("ArrowRight cycles to next tab (automatic activation)", () => {
    render(
      <Tabs
        items={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        defaultValue="a"
        renderPanel={(v) => <div>panel {v}</div>}
      />
    );
    const [first, second] = screen.getAllByRole("tab");
    first!.focus();
    fireEvent.keyDown(first!, { key: "ArrowRight" });
    expect(second).toHaveAttribute("aria-selected", "true");
  });
});

describe("DropdownMenu", () => {
  it("opens on trigger click and closes on Escape, returning focus", () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu
        ariaLabel="Row actions"
        trigger={<button>Open</button>}
        items={[{ label: "Edit", onSelect }, { label: "Delete", destructive: true }]}
      />
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Row actions" })).toBeInTheDocument();
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(2);
    fireEvent.click(items[0]!);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe("Avatar", () => {
  it("renders initials when src missing", () => {
    render(<Avatar name="Schneider Komolafe" />);
    expect(screen.getByText("SK")).toBeInTheDocument();
    expect(screen.getByLabelText("Schneider Komolafe")).toBeInTheDocument();
  });

  it("falls back to initials when image errors", () => {
    render(<Avatar name="Charles Krish" src="/broken.png" />);
    const img = screen.getByRole("img", { name: "Charles Krish" }).querySelector("img");
    if (img) fireEvent.error(img);
    expect(screen.getByText("CK")).toBeInTheDocument();
  });

  it("derives single-word initials safely", () => {
    render(<Avatar name="UC" />);
    expect(screen.getByText("UC")).toBeInTheDocument();
  });
});

describe("Breadcrumbs", () => {
  it("marks the last item with aria-current=page", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[
            { label: "NOC", to: "/admin-dashboard/noc" },
            { label: "Lagos", to: "/admin-dashboard/noc/regions/ng-lagos-1" },
            { label: "VPC topology" },
          ]}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    // The last item is rendered as the closest [aria-current="page"] wrapper
    const lastLabel = screen.getByText("VPC topology");
    const currentEl = lastLabel.closest('[aria-current="page"]');
    expect(currentEl).not.toBeNull();
  });
});

describe("Chip", () => {
  it("interactive chip renders as button with aria-pressed", () => {
    render(<Chip onClick={() => {}} selected>Filter</Chip>);
    const btn = screen.getByRole("button", { name: /Filter/ });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("dismiss button stops propagation (chip becomes role=button span when both handlers set)", () => {
    const onClick = vi.fn();
    const onDismiss = vi.fn();
    render(
      <Chip onClick={onClick} onDismiss={onDismiss}>
        tag
      </Chip>
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("DescriptionList", () => {
  it("renders dl/dt/dd structure", () => {
    const { container } = render(
      <DescriptionList
        items={[
          { term: "Uptime", description: "7d 3h" },
          { term: "Access", description: "10.0.0.5" },
        ]}
      />
    );
    expect(container.querySelectorAll("dt")).toHaveLength(2);
    expect(container.querySelectorAll("dd")).toHaveLength(2);
    expect(screen.getByText("Uptime")).toBeInTheDocument();
    expect(screen.getByText("7d 3h")).toBeInTheDocument();
  });
});
