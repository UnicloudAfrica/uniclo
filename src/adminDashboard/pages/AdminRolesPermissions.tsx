import React, { useCallback, useMemo, useState } from "react";
import { Layers, Plus, ShieldCheck, Sparkles, UserCog } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import EmptyState from "@/shared/components/ui/EmptyState";
import ErrorState from "@/shared/components/ui/ErrorState";
import ModernButton from "@/shared/components/ui/ModernButton";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import {
  buildSegments,
  RoleCard,
  RoleDrawer,
  StatCard,
  type RoleFormState,
} from "@/shared/components/roles/roleVisuals";
import ToastUtils from "@/utils/toastUtil";
import {
  useAdminRoles,
  useAdminPermissionCatalog,
  useCreateAdminRole,
  useUpdateAdminRole,
  useDeleteAdminRole,
  useAssignAdminUserRole,
  type AdminRole,
} from "@/hooks/adminHooks/adminRoleHooks";
import { useFetchAdmins } from "@/hooks/adminHooks/adminHooks";

// ──────────────────────────────────────────────────────────────────────────
// Types + small helpers
// ──────────────────────────────────────────────────────────────────────────

interface AdminUserRow {
  identifier: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string | null;
}

const accent = "var(--theme-color)";

// ──────────────────────────────────────────────────────────────────────────
// Assign-roles section
// ──────────────────────────────────────────────────────────────────────────

const AssignRolesPanel: React.FC<{ roles: AdminRole[] }> = ({ roles }) => {
  const { data: adminsRaw, isLoading } = useFetchAdmins();
  const assignRole = useAssignAdminUserRole();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const admins = useMemo<AdminUserRow[]>(
    () => (Array.isArray(adminsRaw) ? (adminsRaw as AdminUserRow[]) : []),
    [adminsRaw]
  );

  const roleOptions = useMemo(
    () => [
      { label: "No role", value: "" },
      ...roles.map((r) => ({ label: r.name, value: String(r.id) })),
    ],
    [roles]
  );

  // The admins list carries a role *name* string; map it back to an id for the select.
  const roleNameToId = useMemo(() => {
    const m = new Map<string, number>();
    roles.forEach((r) => m.set(r.name.toLowerCase(), r.id));
    return m;
  }, [roles]);

  const handleAssign = async (admin: AdminUserRow, raw: string) => {
    setPendingId(admin.identifier);
    try {
      await assignRole.mutateAsync({
        id: admin.identifier,
        role_id: raw === "" ? null : Number(raw),
      });
      ToastUtils.success("Role updated");
    } catch {
      ToastUtils.error("Failed to update role");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (admins.length === 0) {
    return (
      <EmptyState
        icon={<UserCog size={24} />}
        title="No admins to assign"
        description="Once admin users exist, assign each one a role here to control their access."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {admins.map((admin) => {
          const fullName =
            [admin.first_name, admin.last_name].filter(Boolean).join(" ").trim() ||
            admin.email ||
            "Unnamed admin";
          const currentId = admin.role ? roleNameToId.get(admin.role.toLowerCase()) : undefined;
          return (
            <li
              key={admin.identifier}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ background: "var(--theme-color-10)", color: accent }}
                >
                  {fullName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {fullName}
                  </p>
                  {admin.email ? (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {admin.email}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="w-full sm:w-56">
                <ModernSelect
                  size="sm"
                  options={roleOptions}
                  value={currentId !== undefined ? String(currentId) : ""}
                  disabled={pendingId === admin.identifier}
                  onChange={(e) => handleAssign(admin, e.target.value)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────

type TabKey = "roles" | "assign";

const AdminRolesPermissions: React.FC = () => {
  const { data: roles, isLoading, isError, refetch } = useAdminRoles();
  const { data: catalog } = useAdminPermissionCatalog();
  const createRole = useCreateAdminRole();
  const updateRole = useUpdateAdminRole();
  const deleteRole = useDeleteAdminRole();

  const [tab, setTab] = useState<TabKey>("roles");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminRole | null>(null);

  const rows = useMemo<AdminRole[]>(() => (Array.isArray(roles) ? roles : []), [roles]);
  const catalogGroups = useMemo<[string, string[]][]>(
    () => Object.entries(catalog ?? {}),
    [catalog]
  );
  const totalPermissions = useMemo(
    () => catalogGroups.reduce((sum, [, perms]) => sum + perms.length, 0),
    [catalogGroups]
  );

  const customCount = rows.filter((r) => !r.is_system).length;
  const systemCount = rows.length - customCount;
  const adminsAssigned = rows.reduce((sum, r) => sum + (r.member_count || 0), 0);

  const openCreate = useCallback(() => {
    setEditing(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((role: AdminRole) => {
    setEditing(role);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditing(null);
  }, []);

  const saving = createRole.isPending || updateRole.isPending;

  const handleSubmit = useCallback(
    async (form: RoleFormState) => {
      const name = form.name.trim();
      if (name === "" || saving) return;
      const description = form.description.trim();
      const permissions = Array.from(form.permissions);
      try {
        if (editing) {
          await updateRole.mutateAsync({ id: editing.id, data: { name, description, permissions } });
          ToastUtils.success(`Role "${name}" updated`);
        } else {
          await createRole.mutateAsync({ name, description, permissions });
          ToastUtils.success(`Role "${name}" created`);
        }
        closeDrawer();
      } catch {
        ToastUtils.error(`Failed to ${editing ? "update" : "create"} role`);
      }
    },
    [editing, saving, updateRole, createRole, closeDrawer]
  );

  const handleDelete = useCallback(async () => {
    if (!pendingDelete || deleteRole.isPending) return;
    const target = pendingDelete;
    try {
      await deleteRole.mutateAsync(target.id);
      ToastUtils.success(`Role "${target.name}" deleted`);
      setPendingDelete(null);
    } catch {
      ToastUtils.error("Failed to delete role");
    }
  }, [pendingDelete, deleteRole]);

  const headerActions = (
    <ModernButton variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
      Create role
    </ModernButton>
  );

  const renderRolesTab = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-[78px] w-[78px] rounded-full" />
              </div>
              <Skeleton className="mt-4 h-16 w-full rounded-xl" />
              <Skeleton className="mt-4 h-8 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <ErrorState
          title="Could not load roles"
          message="Something went wrong while fetching admin roles."
          onRetry={() => refetch()}
        />
      );
    }

    if (rows.length === 0) {
      return (
        <EmptyState
          icon={<ShieldCheck size={24} />}
          title="No roles yet"
          description="Create a custom role to bundle permissions and assign them to administrators."
          action={headerActions}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            totalPermissions={totalPermissions}
            segments={buildSegments(new Set(role.permissions), catalogGroups)}
            memberNoun="admin"
            onEdit={() => openEdit(role)}
            onDelete={() => setPendingDelete(role)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <AdminPageShell
            title="Roles & Permissions"
            description="Bundle permissions into roles and control what each administrator can access."
            actions={headerActions}
          >
            {/* Summary stat tiles */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total roles"
                value={rows.length}
                hint={`${customCount} custom · ${systemCount} system`}
                icon={<ShieldCheck size={18} />}
                loading={isLoading}
              />
              <StatCard
                label="Custom roles"
                value={customCount}
                hint="Editable, team-defined"
                icon={<Sparkles size={18} />}
                loading={isLoading}
              />
              <StatCard
                label="Permissions"
                value={totalPermissions}
                hint={`across ${catalogGroups.length} groups`}
                icon={<Layers size={18} />}
              />
              <StatCard
                label="Admins assigned"
                value={adminsAssigned}
                hint="With a role attached"
                icon={<UserCog size={18} />}
                loading={isLoading}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
              {([
                { key: "roles" as const, label: "Roles", icon: <ShieldCheck size={15} /> },
                { key: "assign" as const, label: "Assign admins", icon: <UserCog size={15} /> },
              ]).map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "text-gray-900 dark:text-white"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    style={active ? { borderColor: accent } : undefined}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tab === "roles" ? renderRolesTab() : <AssignRolesPanel roles={rows} />}
          </AdminPageShell>
        </main>
      </div>

      <RoleDrawer
        open={drawerOpen}
        editing={editing}
        catalog={catalog}
        totalPermissions={totalPermissions}
        saving={saving}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete role"
        message={
          pendingDelete
            ? `Delete role "${pendingDelete.name}"? Admins assigned to it will lose its permissions.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteRole.isPending}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default AdminRolesPermissions;
