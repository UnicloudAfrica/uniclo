/**
 * RTL test suite — verifies primitives render and remain interactive
 * inside a `dir="rtl"` wrapper.
 *
 * The goal is not to assert visual mirroring (CSS does that) but to
 * confirm:
 *   - structural integrity (correct roles, labels, ARIA)
 *   - keyboard activation still works
 *   - no element renders text content that depends on directional layout
 *     (e.g. labels still announce verbatim, breadcrumb hierarchy still
 *     marks the last page as aria-current)
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
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

const Rtl: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div dir="rtl">{children}</div>
);

describe("RTL — primitives keep semantics under dir=rtl", () => {
  it("SurfaceCard onClick still activates with keyboard in RTL", () => {
    const onClick = (() => {
      hits++;
    }) as () => void;
    let hits = 0;
    render(
      <Rtl>
        <SurfaceCard onClick={onClick} data-testid="card">
          خانه
        </SurfaceCard>
      </Rtl>
    );
    const el = screen.getByTestId("card");
    expect(el).toHaveAttribute("role", "button");
    fireEvent.keyDown(el, { key: "Enter" });
    expect(hits).toBe(1);
  });

  it("Gauge ARIA values render unchanged under RTL", () => {
    render(
      <Rtl>
        <Gauge value={42} label="پردازنده" />
      </Rtl>
    );
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "42");
  });

  it("ProgressBar ARIA values render unchanged under RTL", () => {
    render(
      <Rtl>
        <ProgressBar value={70} label="حافظه" />
      </Rtl>
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "70");
  });

  it("StatTile + KpiTile expose value/label correctly in RTL", () => {
    render(
      <Rtl>
        <StatTile label="VMs" value={42} />
        <KpiTile label="Regions" value={7} tone="primary" />
      </Rtl>
    );
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("InfoCallout dismiss button still operable under RTL", () => {
    let dismissed = 0;
    render(
      <Rtl>
        <InfoCallout tone="warning" onDismiss={() => (dismissed += 1)}>
          توجه
        </InfoCallout>
      </Rtl>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(dismissed).toBe(1);
  });

  it("LoadingState announces via role=status in RTL", () => {
    render(
      <Rtl>
        <LoadingState message="در حال بارگذاری" />
      </Rtl>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("ErrorState retry still focusable in RTL", () => {
    render(
      <Rtl>
        <ErrorState onRetry={() => {}} autoFocusRetry={false} />
      </Rtl>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("Tabs roving tabindex works in RTL (ArrowRight still cycles)", () => {
    render(
      <Rtl>
        <Tabs
          ariaLabel="rtl tabs"
          items={[
            { value: "a", label: "الف" },
            { value: "b", label: "ب" },
          ]}
          defaultValue="a"
          renderPanel={(v) => <div>{v}</div>}
        />
      </Rtl>
    );
    const [first, second] = screen.getAllByRole("tab");
    first!.focus();
    fireEvent.keyDown(first!, { key: "ArrowRight" });
    expect(second).toHaveAttribute("aria-selected", "true");
  });

  it("Breadcrumbs current page is aria-current=page in RTL", () => {
    render(
      <Rtl>
        <MemoryRouter>
          <Breadcrumbs
            items={[
              { label: "خانه", to: "/" },
              { label: "صفحه فعلی" },
            ]}
          />
        </MemoryRouter>
      </Rtl>
    );
    const last = screen.getByText("صفحه فعلی");
    expect(last.closest('[aria-current="page"]')).not.toBeNull();
  });

  it("Avatar derives initials and is announced via aria-label", () => {
    render(
      <Rtl>
        <Avatar name="علی رضا" />
      </Rtl>
    );
    expect(screen.getByLabelText("علی رضا")).toBeInTheDocument();
  });

  it("Chip dismiss button stops propagation in RTL", () => {
    let toggled = 0;
    let removed = 0;
    render(
      <Rtl>
        <Chip onClick={() => (toggled += 1)} onDismiss={() => (removed += 1)}>
          فیلتر
        </Chip>
      </Rtl>
    );
    const buttons = screen.getAllByRole("button");
    // Last button is the dismiss
    fireEvent.click(buttons[buttons.length - 1]!);
    expect(removed).toBe(1);
    expect(toggled).toBe(0);
  });

  it("DescriptionList keeps dl/dt/dd structure under RTL", () => {
    const { container } = render(
      <Rtl>
        <DescriptionList
          items={[
            { term: "نام", description: "آلفا" },
            { term: "وضعیت", description: "فعال" },
          ]}
        />
      </Rtl>
    );
    expect(container.querySelectorAll("dt")).toHaveLength(2);
    expect(container.querySelectorAll("dd")).toHaveLength(2);
  });

  it("SectionHeader count badge is announced in RTL", () => {
    render(
      <Rtl>
        <SectionHeader title="منطقه‌ها" count={5} />
      </Rtl>
    );
    expect(within(screen.getByRole("heading")).getByText("(5)")).toBeInTheDocument();
  });
});
