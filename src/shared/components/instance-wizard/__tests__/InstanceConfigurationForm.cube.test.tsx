import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import InstanceConfigurationForm from "../InstanceConfigurationForm";
import { makePricingNoticeOption } from "../ComputeImageSection";
import type { Configuration, Option } from "@/types/InstanceConfiguration";

/*
 * Cube-variant inline Instance Type / OS Image selects must consume the
 * pricing-notice sentinel Options (see ComputeImageSection) the same way
 * the classic variant does: notice as placeholder/helper copy, never as a
 * selectable row, disabled while pricing loads.
 */

vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({ context: "client" }),
}));
vi.mock("@/hooks/networkPresetHooks", () => ({
  useNetworkPresets: () => ({ data: [] }),
}));
vi.mock("@/hooks/adminHooks/projectHooks", () => ({
  useProjectMembershipSuggestions: () => ({ data: [], isFetching: false }),
}));
vi.mock("../../../../index/admin/api", () => ({ default: vi.fn() }));
vi.mock("../../../../index/tenant/tenantApi", () => ({ default: vi.fn() }));
vi.mock("../../../../index/client/api", () => ({ default: vi.fn() }));
vi.mock("@/utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const AWAITING_AZ = "Pick an availability zone to see available sizes and prices.";

const makeCfg = (overrides: Partial<Configuration> = {}): Configuration =>
  ({
    id: "cfg-1",
    name: "",
    description: "",
    region: "uni-ng",
    region_label: "Nigeria",
    project_mode: "new",
    project_name: "Demo",
    network_preset: "standard",
    months: 6,
    instance_count: 1,
    compute_instance_id: "",
    compute_label: "",
    os_image_id: "",
    os_image_label: "",
    volume_type_id: "",
    volume_type_label: "",
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
  }) as unknown as Configuration;

const renderCubeForm = (props: {
  computeOptions?: Option[];
  osImageOptions?: Option[];
  showActionRow?: boolean;
}) =>
  render(
    <InstanceConfigurationForm
      cfg={makeCfg()}
      index={0}
      totalConfigurations={1}
      updateConfiguration={vi.fn()}
      removeConfiguration={vi.fn()}
      addAdditionalVolume={vi.fn()}
      updateAdditionalVolume={vi.fn()}
      removeAdditionalVolume={vi.fn()}
      regionOptions={[{ value: "uni-ng", label: "Nigeria" }]}
      projectOptions={[]}
      computeOptions={props.computeOptions ?? []}
      osImageOptions={props.osImageOptions ?? []}
      volumeTypeOptions={[]}
      networkOptions={[]}
      subnetOptions={[]}
      bandwidthOptions={[]}
      keyPairOptions={[]}
      securityGroups={[]}
      isProjectScoped={false}
      isLoadingResources={false}
      showActionRow={props.showActionRow ?? false}
      onSubmitConfigurations={vi.fn()}
      variant="cube"
    />
  );

describe("InstanceConfigurationForm cube variant pricing notices", () => {
  it("surfaces awaiting-AZ notices as helper copy, not selectable options", () => {
    renderCubeForm({
      computeOptions: [makePricingNoticeOption("awaiting_az", AWAITING_AZ)],
      osImageOptions: [makePricingNoticeOption("awaiting_az", AWAITING_AZ)],
    });

    // Helper copy under both the size and the image selects.
    expect(screen.getAllByText(AWAITING_AZ)).toHaveLength(2);
    // The trigger still shows the normal placeholder — the sentinel was
    // stripped from the choices instead of becoming the selected row.
    expect(screen.getByText("Select instance type")).toBeInTheDocument();
    expect(screen.getByText("Select OS image")).toBeInTheDocument();
  });

  it("disables the selects and shows loading labels while pricing loads", () => {
    renderCubeForm({
      computeOptions: [makePricingNoticeOption("loading", "Loading sizes…")],
      osImageOptions: [makePricingNoticeOption("loading", "Loading OS images…")],
    });

    const computeTrigger = screen.getByText("Loading sizes…").closest("button");
    const osTrigger = screen.getByText("Loading OS images…").closest("button");
    expect(computeTrigger).toBeDisabled();
    expect(osTrigger).toBeDisabled();
  });

  it("renders real options normally once pricing resolves", () => {
    renderCubeForm({
      computeOptions: [{ value: "42", label: "m1.small • 2 vCPU • NGN 5,000.00" }],
      osImageOptions: [{ value: "7", label: "Ubuntu 24.04 • NGN 0.00" }],
    });

    expect(screen.getByText("Select instance type")).toBeInTheDocument();
    expect(screen.getByText("Select OS image")).toBeInTheDocument();
    expect(screen.getByText("Select the compute flavor.")).toBeInTheDocument();
    expect(screen.getByText("Choose the base image.")).toBeInTheDocument();
  });

  it("labels the submit button in plain language", () => {
    renderCubeForm({ showActionRow: true });

    expect(screen.getByText("Continue to payment")).toBeInTheDocument();
    expect(screen.queryByText(/and price/i)).not.toBeInTheDocument();
  });
});
