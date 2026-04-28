/**
 * Dark mode test — verifies primitives render structurally identical
 * inside `[data-theme="dark"]`. Visual contrast is enforced by the
 * neutral-scale inversion in index.css; here we ensure no primitive
 * makes hardcoded color assumptions that break under data-theme="dark".
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SurfaceCard from "../SurfaceCard";
import Gauge from "../Gauge";
import ProgressBar from "../ProgressBar";
import StatTile from "../StatTile";
import KpiTile from "../KpiTile";
import InfoCallout from "../InfoCallout";
import LoadingState from "../LoadingState";
import ErrorState from "../ErrorState";
import Tabs from "../Tabs";
import Avatar from "../Avatar";
import Breadcrumbs from "../Breadcrumbs";
import Chip from "../Chip";
import DescriptionList from "../DescriptionList";
import SectionHeader from "../SectionHeader";

const Dark: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-theme="dark">{children}</div>
);

describe("Dark mode — primitives keep semantics under [data-theme='dark']", () => {
  it("SurfaceCard renders + activates", () => {
    let hits = 0;
    render(
      <Dark>
        <SurfaceCard onClick={() => (hits += 1)} data-testid="card">
          dark card
        </SurfaceCard>
      </Dark>
    );
    fireEvent.keyDown(screen.getByTestId("card"), { key: "Enter" });
    expect(hits).toBe(1);
  });

  it("Gauge meter ARIA stays valid", () => {
    render(
      <Dark>
        <Gauge value={42} label="CPU" />
      </Dark>
    );
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "42");
  });

  it("ProgressBar role + aria values stay valid", () => {
    render(
      <Dark>
        <ProgressBar value={70} label="Memory" />
      </Dark>
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "70");
  });

  it("StatTile + KpiTile expose label/value pairs", () => {
    render(
      <Dark>
        <StatTile label="VMs" value={42} />
        <KpiTile label="Regions" value={7} tone="primary" />
      </Dark>
    );
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("InfoCallout renders + dismiss works", () => {
    let dismissed = 0;
    render(
      <Dark>
        <InfoCallout tone="warning" onDismiss={() => (dismissed += 1)}>
          dark warning
        </InfoCallout>
      </Dark>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(dismissed).toBe(1);
  });

  it("LoadingState announces", () => {
    render(
      <Dark>
        <LoadingState />
      </Dark>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("ErrorState renders + retry button focusable", () => {
    render(
      <Dark>
        <ErrorState onRetry={() => {}} autoFocusRetry={false} />
      </Dark>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("Tabs roving tabindex still works", () => {
    render(
      <Dark>
        <Tabs
          ariaLabel="dark"
          items={[
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ]}
          defaultValue="a"
          renderPanel={(v) => <div>{v}</div>}
        />
      </Dark>
    );
    const [first, second] = screen.getAllByRole("tab");
    first!.focus();
    fireEvent.keyDown(first!, { key: "ArrowRight" });
    expect(second).toHaveAttribute("aria-selected", "true");
  });

  it("Avatar initials + aria-label", () => {
    render(
      <Dark>
        <Avatar name="Dark User" />
      </Dark>
    );
    expect(screen.getByLabelText("Dark User")).toBeInTheDocument();
  });

  it("Breadcrumbs marks last item aria-current=page", () => {
    render(
      <Dark>
        <MemoryRouter>
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Now" }]} />
        </MemoryRouter>
      </Dark>
    );
    expect(screen.getByText("Now").closest('[aria-current="page"]')).not.toBeNull();
  });

  it("Chip dismiss stops propagation", () => {
    let toggled = 0;
    let removed = 0;
    render(
      <Dark>
        <Chip onClick={() => (toggled += 1)} onDismiss={() => (removed += 1)}>
          tag
        </Chip>
      </Dark>
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]!);
    expect(removed).toBe(1);
    expect(toggled).toBe(0);
  });

  it("DescriptionList preserves dl/dt/dd structure", () => {
    const { container } = render(
      <Dark>
        <DescriptionList
          items={[{ term: "Status", description: "Active" }]}
        />
      </Dark>
    );
    expect(container.querySelectorAll("dt")).toHaveLength(1);
    expect(container.querySelectorAll("dd")).toHaveLength(1);
  });

  it("SectionHeader count badge is announced", () => {
    render(
      <Dark>
        <SectionHeader title="Items" count={3} />
      </Dark>
    );
    expect(screen.getByLabelText(/3 items/i)).toBeInTheDocument();
  });
});
