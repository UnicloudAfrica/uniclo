import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResourceProtectionTab from "../ResourceProtectionTab";

const mocks = vi.hoisted(() => ({
  backupStatus: undefined as unknown,
  replicationStatus: undefined as unknown,
  operations: [] as unknown[],
  enableBackupMutate: vi.fn(),
  updateBackupMutate: vi.fn(),
  disableBackupMutate: vi.fn(),
  setBackupPolicyStateMutate: vi.fn(),
  triggerBackupMutate: vi.fn(),
  enableReplicationMutate: vi.fn(),
  disableReplicationMutate: vi.fn(),
  failoverMutate: vi.fn(),
}));

vi.mock("@/shared/hooks/resources/integrationHooks", () => ({
  useBackupStatus: () => ({ data: mocks.backupStatus, isLoading: false }),
  useReplicationStatus: () => ({ data: mocks.replicationStatus, isLoading: false }),
  useFetchIntegrationOperations: () => ({ data: mocks.operations, isLoading: false }),
  useEnableBackup: () => ({ mutate: mocks.enableBackupMutate, isPending: false }),
  useUpdateBackup: () => ({ mutate: mocks.updateBackupMutate, isPending: false }),
  useDisableBackup: () => ({ mutate: mocks.disableBackupMutate, isPending: false }),
  useSetBackupPolicyState: () => ({
    mutate: mocks.setBackupPolicyStateMutate,
    isPending: false,
  }),
  useTriggerBackup: () => ({ mutate: mocks.triggerBackupMutate, isPending: false }),
  useEnableReplication: () => ({ mutate: mocks.enableReplicationMutate, isPending: false }),
  useDisableReplication: () => ({ mutate: mocks.disableReplicationMutate, isPending: false }),
  useFailover: () => ({ mutate: mocks.failoverMutate, isPending: false }),
  useRansomwareScans: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("../IntegrationStatusBadge", () => ({
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock("../IntegrationOperationsTable", () => ({
  default: () => <div>Operations table</div>,
}));

vi.mock("../BackupSnapshotsList", () => ({
  default: ({ onRestore }: { onRestore: (snapshot: Record<string, unknown>) => void }) => (
    <button type="button" onClick={() => onRestore({ identifier: "snap-1" })}>
      Restore snapshot
    </button>
  ),
}));

vi.mock("../PitrPanel", () => ({
  default: () => <div>PITR panel</div>,
}));

vi.mock("../RestoreSnapshotModal", () => ({
  default: ({ isOpen, snapshot }: { isOpen: boolean; snapshot: Record<string, unknown> | null }) =>
    isOpen ? <div>Restore modal {String(snapshot?.identifier)}</div> : null,
}));

vi.mock("../ReplicationConfigModal", () => ({
  default: () => null,
}));

vi.mock("../BackupConfigWizard", () => ({
  default: ({
    mode,
    onSubmit,
  }: {
    mode?: "create" | "edit";
    onSubmit: (config: Record<string, unknown>) => void;
  }) => (
    <div data-testid="backup-wizard" data-mode={mode}>
      <button
        type="button"
        onClick={() =>
          onSubmit({
            name: "Daily VM backup",
            schedule_type: "daily",
            backup_type: "full",
            retention_days: 30,
            destination_ids: [7],
          })
        }
      >
        Submit backup wizard
      </button>
    </div>
  ),
}));

describe("ResourceProtectionTab backup experience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.operations = [];
    mocks.replicationStatus = { enabled: false };
    mocks.backupStatus = {
      enabled: true,
      status: "active",
      subscription: {
        id: "1",
        identifier: "sub-1",
        service_type: "backup",
        service_subtype: "daily",
        status: "active",
        created_at: "2026-05-13T08:00:00Z",
      },
      policy: {
        name: "Daily VM backup",
        status: "active",
        schedule: "daily",
        backup_type: "full",
        retention_days: 30,
      },
      destinations: [
        {
          id: 7,
          integration_key: "anycloudflow",
          source_region: "uni-ng-lag-az1",
          target_region: "external",
          destination_type: "s3",
          name: "Tenant S3",
          is_default: true,
          is_active: true,
        },
      ],
      snapshots_count: 2,
      last_backup: { completed_at: "2026-05-13T08:30:00Z" },
      next_backup_at: "2026-05-14T08:30:00Z",
    };
  });

  const renderTab = () =>
    render(
      <ResourceProtectionTab
        resourceType="instance"
        resourceId={42}
        resourceName="App VM"
        resourceRegion="uni-ng-lag-az1"
      />
    );

  it("renders the active backup policy actions without a disconnected restore button", () => {
    renderTab();

    expect(screen.getByText("Automated backups are active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Backup Now/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Edit Policy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Disable/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Restore$/i })).not.toBeInTheDocument();
  });

  it("edits an existing policy through the update mutation", async () => {
    renderTab();

    await userEvent.click(screen.getByRole("button", { name: /Edit Policy/i }));
    expect(screen.getByTestId("backup-wizard")).toHaveAttribute("data-mode", "edit");

    await userEvent.click(screen.getByRole("button", { name: /Submit backup wizard/i }));

    expect(mocks.updateBackupMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        integrationKey: "anycloudflow",
        resourceType: "instance",
        resourceId: 42,
        config: expect.objectContaining({ schedule_type: "daily", destination_ids: [7] }),
      }),
      expect.any(Object)
    );
    expect(mocks.enableBackupMutate).not.toHaveBeenCalled();
  });

  it("pauses and resumes the remote policy state", async () => {
    const { rerender } = renderTab();

    await userEvent.click(screen.getByRole("button", { name: /Pause/i }));
    expect(mocks.setBackupPolicyStateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ action: "pause" })
    );

    mocks.backupStatus = {
      ...(mocks.backupStatus as Record<string, unknown>),
      status: "paused",
      policy: { status: "paused", schedule: "daily", backup_type: "full" },
    };

    rerender(
      <ResourceProtectionTab
        resourceType="instance"
        resourceId={42}
        resourceName="App VM"
        resourceRegion="uni-ng-lag-az1"
      />
    );

    expect(screen.getByRole("button", { name: /Backup Now/i })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /Resume/i }));
    expect(mocks.setBackupPolicyStateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ action: "resume" })
    );
  });

  it("creates a new policy through the enable mutation when backup is disabled", async () => {
    mocks.backupStatus = { enabled: false };
    renderTab();

    await userEvent.click(screen.getByRole("button", { name: /Enable Backup/i }));
    expect(screen.getByTestId("backup-wizard")).toHaveAttribute("data-mode", "create");

    await userEvent.click(screen.getByRole("button", { name: /Submit backup wizard/i }));

    expect(mocks.enableBackupMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        integrationKey: "anycloudflow",
        resourceType: "instance",
        resourceId: 42,
        config: expect.objectContaining({ backup_type: "full", retention_days: 30 }),
      }),
      expect.any(Object)
    );
    expect(mocks.updateBackupMutate).not.toHaveBeenCalled();
  });

  it("surfaces the latest backup failure clearly", () => {
    mocks.backupStatus = {
      ...(mocks.backupStatus as Record<string, unknown>),
      last_error: {
        operation_identifier: "OP-BACKUPFAIL",
        operation_type: "backup",
        message: "S3 credentials rejected by destination",
        occurred_at: "2026-05-13T08:35:00Z",
      },
    };

    renderTab();

    expect(screen.getByRole("alert")).toHaveTextContent("Latest backup issue");
    expect(screen.getByRole("alert")).toHaveTextContent("S3 credentials rejected");
  });
});
