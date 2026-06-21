import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NetworkingSection from "../NetworkingSection";
import { makePricingNoticeOption } from "../ComputeImageSection";
import type { Configuration } from "@/types/InstanceConfiguration";

/*
 * The bandwidth dropdown receives pricing-notice sentinel Options (see
 * ComputeImageSection) when its list is empty because pricing is loading
 * or waiting on an AZ pick. They must surface as placeholder/helper copy
 * — never as selectable rows — and must not be auto-picked as the
 * baseline bandwidth default.
 */

const AWAITING_AZ = "Pick an availability zone to see available sizes and prices.";

const baseProps = {
  cfg: { id: "cfg-1", bandwidth_id: "", network_id: "", subnet_id: "" } as unknown as Configuration,
  networkOptions: [],
  subnetOptions: [],
  isProjectScoped: true,
  isLoadingResources: false,
  hasFloatingIp: false,
  isPresetRequiresEip: false,
  securityGroups: [],
  updateConfigWithFocus: vi.fn(),
  handleSecurityGroupToggle: vi.fn(),
};

describe("NetworkingSection bandwidth pricing notices", () => {
  it("surfaces the awaiting-AZ notice as helper copy without auto-selecting it", () => {
    const updateConfigWithFocus = vi.fn();
    render(
      <NetworkingSection
        {...baseProps}
        updateConfigWithFocus={updateConfigWithFocus}
        bandwidthOptions={[makePricingNoticeOption("awaiting_az", AWAITING_AZ)]}
      />
    );

    expect(screen.getByText(AWAITING_AZ)).toBeInTheDocument();
    // The sentinel must not be treated as a real tier by the
    // default-bandwidth auto-select effect.
    expect(updateConfigWithFocus).not.toHaveBeenCalled();
  });

  it("disables the select and shows the loading label while pricing loads", () => {
    render(
      <NetworkingSection
        {...baseProps}
        bandwidthOptions={[makePricingNoticeOption("loading", "Loading bandwidth options…")]}
      />
    );

    const placeholder = screen.getByText("Loading bandwidth options…");
    expect(placeholder).toBeInTheDocument();
    // SearchableSelect renders its trigger as a button.
    expect(placeholder.closest("button")).toBeDisabled();
  });

  it("auto-selects the baseline 10 Mbps tier from real options only", () => {
    const updateConfigWithFocus = vi.fn();
    render(
      <NetworkingSection
        {...baseProps}
        updateConfigWithFocus={updateConfigWithFocus}
        bandwidthOptions={[
          makePricingNoticeOption("loading", "Loading bandwidth options…"),
          { value: "bw-10", label: "10 Mbps • NGN 1,000.00" },
        ]}
      />
    );

    expect(updateConfigWithFocus).toHaveBeenCalledWith({
      bandwidth_id: "bw-10",
      bandwidth_count: 1,
    });
  });
});
