import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RegionProjectSection from "../RegionProjectSection";
import type { Configuration } from "@/types/InstanceConfiguration";

/*
 * AZ select copy: in a multi-provider region the product pricing fetches
 * are gated on an AZ pick (AdminInstanceConfigurationCard sets
 * requiresAzForPricing), so the helper must steer the user to pick a
 * zone. Recommending "Auto-assign" there leaves every product dropdown
 * blank with no explanation.
 */

const baseProps = {
  cfg: { id: "cfg-1", region: "uni-ng", months: 6 } as unknown as Configuration,
  regionOptions: [],
  projectSelectOptions: [],
  projectSelectValue: "",
  effectiveProjectMode: "new",
  isTemplateLocked: false,
  selectedRegion: "uni-ng",
  networkPresetValue: "standard",
  presetOptions: [],
  selectedPreset: null,
  selectedProjectPreset: null,
  selectedProject: null,
  isSelectedProjectPresetPublic: false,
  hasFloatingIp: false,
  normalizedFloatingIpCount: 0,
  isLoadingResources: false,
  isSubmitting: false,
  focusKey: (field: string) => field,
  updateConfigWithFocus: vi.fn(),
  handleProjectModeChange: vi.fn(),
  handleProjectSelection: vi.fn(),
  projectModeOptions: [{ value: "new", label: "Create new project" }],
  azSelectionMode: "user_selectable" as const,
  availabilityZoneOptions: [
    { value: "uni-ng-az-1", label: "Zone 1" },
    { value: "uni-ng-az-2", label: "Zone 2" },
  ],
};

describe("RegionProjectSection AZ helper copy", () => {
  it("steers the user to pick an AZ when pricing requires one (multi-provider region)", () => {
    render(<RegionProjectSection {...baseProps} requiresAzForPricing />);

    expect(
      screen.getByText("Pick an availability zone to see available sizes and prices.")
    ).toBeInTheDocument();
    expect(screen.getByText("Select availability zone")).toBeInTheDocument();
    expect(screen.queryByText("Auto-assign")).not.toBeInTheDocument();
  });

  it("keeps the auto-assign copy when pricing works without an AZ", () => {
    render(<RegionProjectSection {...baseProps} />);

    expect(
      screen.getByText("Select a specific availability zone or let the platform auto-assign.")
    ).toBeInTheDocument();
    expect(screen.getByText("Auto-assign")).toBeInTheDocument();
  });
});
