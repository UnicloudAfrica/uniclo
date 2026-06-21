import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ComputeImageSection, { makePricingNoticeOption } from "../ComputeImageSection";
import type { Configuration, Option } from "@/types/InstanceConfiguration";

const makeCfg = (overrides: Partial<Configuration> = {}): Configuration => ({
  id: "cfg-1",
  launch_mode: "custom",
  name: "",
  instance_count: 1,
  description: "",
  project_id: "",
  region: "lagos",
  months: 1,
  compute_instance_id: "",
  os_image_id: "",
  volume_type_id: "",
  storage_size_gb: 50,
  bandwidth_id: "",
  bandwidth_count: 0,
  floating_ip_count: 0,
  security_group_ids: [],
  keypair_name: "",
  keypair_label: "",
  additional_volumes: [],
  network_id: "",
  subnet_id: "",
  subnet_label: "",
  tags: "",
  ...overrides,
});

const renderSection = ({
  computeOptions = [],
  osImageOptions = [],
  selectedRegion = "lagos",
}: {
  computeOptions?: Option[];
  osImageOptions?: Option[];
  selectedRegion?: string;
} = {}) =>
  render(
    <ComputeImageSection
      cfg={makeCfg()}
      computeOptions={computeOptions}
      osImageOptions={osImageOptions}
      selectedRegion={selectedRegion}
      templateComputeLabel=""
      templateImageLabel=""
      updateConfigWithFocus={vi.fn()}
    />
  );

describe("ComputeImageSection", () => {
  it("shows a loading placeholder and disables the dropdowns while pricing is fetching", () => {
    renderSection({
      computeOptions: [makePricingNoticeOption("loading", "Loading sizes…")],
      osImageOptions: [makePricingNoticeOption("loading", "Loading OS images…")],
    });

    expect(screen.getByText("Loading sizes…").closest("button")).toBeDisabled();
    expect(screen.getByText("Loading OS images…").closest("button")).toBeDisabled();
  });

  it("explains a settled-empty zone in the helper without rendering the notice as an option", () => {
    renderSection({
      computeOptions: [
        makePricingNoticeOption(
          "empty",
          "No instance types are published for this zone yet — try another availability zone."
        ),
      ],
    });

    const trigger = screen.getByText("Select instance type").closest("button");
    expect(trigger).not.toBeDisabled();
    fireEvent.click(trigger as HTMLButtonElement);

    // Helper copy only — the sentinel must be stripped from the list.
    expect(screen.getAllByText(/No instance types are published for this zone yet/i)).toHaveLength(
      1
    );
  });

  it("tells the user to pick an availability zone when pricing is AZ-gated", () => {
    const azNotice = makePricingNoticeOption(
      "awaiting_az",
      "Pick an availability zone to see available sizes and prices."
    );
    renderSection({ computeOptions: [azNotice], osImageOptions: [azNotice] });

    expect(
      screen.getAllByText("Pick an availability zone to see available sizes and prices.")
    ).toHaveLength(2);
    // Settled state — the dropdowns stay enabled.
    expect(screen.getByText("Select instance type").closest("button")).not.toBeDisabled();
  });

  it("renders real options untouched when pricing resolved", () => {
    renderSection({
      computeOptions: [{ value: "7", label: "m1.small • 2 vCPU • 4 GB RAM" }],
    });

    const trigger = screen.getByText("Select instance type").closest("button");
    expect(trigger).not.toBeDisabled();
    fireEvent.click(trigger as HTMLButtonElement);
    expect(screen.getByText("m1.small • 2 vCPU • 4 GB RAM")).toBeInTheDocument();
    expect(screen.getByText("Select the compute flavor.")).toBeInTheDocument();
  });

  it("keeps the region-first placeholder when no region is selected", () => {
    renderSection({ selectedRegion: "" });

    expect(screen.getAllByText("Select region first")).toHaveLength(2);
  });
});
