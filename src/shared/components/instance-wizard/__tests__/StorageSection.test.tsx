import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StorageSection from "../StorageSection";
import { makePricingNoticeOption } from "../ComputeImageSection";
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

const renderSection = (volumeTypeOptions: Option[] = [], selectedRegion = "lagos") =>
  render(
    <StorageSection
      cfg={makeCfg()}
      volumeTypeOptions={volumeTypeOptions}
      selectedRegion={selectedRegion}
      templateVolumeLabel=""
      templateVolumeSize=""
      updateConfigWithFocus={vi.fn()}
    />
  );

describe("StorageSection", () => {
  it("shows a loading placeholder and disables the volume type dropdown while fetching", () => {
    renderSection([makePricingNoticeOption("loading", "Loading volume types…")]);

    expect(screen.getByText("Loading volume types…").closest("button")).toBeDisabled();
  });

  it("explains a settled-empty zone in the helper without rendering the notice as an option", () => {
    renderSection([
      makePricingNoticeOption(
        "empty",
        "No volume types are published for this zone yet — try another availability zone."
      ),
    ]);

    const trigger = screen.getByText("Select volume type").closest("button");
    expect(trigger).not.toBeDisabled();
    fireEvent.click(trigger as HTMLButtonElement);

    expect(screen.getAllByText(/No volume types are published for this zone yet/i)).toHaveLength(1);
  });

  it("tells the user to pick an availability zone when pricing is AZ-gated", () => {
    renderSection([
      makePricingNoticeOption(
        "awaiting_az",
        "Pick an availability zone to see available sizes and prices."
      ),
    ]);

    expect(
      screen.getByText("Pick an availability zone to see available sizes and prices.")
    ).toBeInTheDocument();
    expect(screen.getByText("Select volume type").closest("button")).not.toBeDisabled();
  });

  it("renders real options with the default helper when pricing resolved", () => {
    renderSection([{ value: "ssd", label: "SSD • NGN 100.00" }]);

    const trigger = screen.getByText("Select volume type").closest("button");
    fireEvent.click(trigger as HTMLButtonElement);
    expect(screen.getByText("SSD • NGN 100.00")).toBeInTheDocument();
    expect(screen.getByText("Choose the primary volume class.")).toBeInTheDocument();
  });
});
