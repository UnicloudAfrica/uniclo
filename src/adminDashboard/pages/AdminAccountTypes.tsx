import React, { useCallback, useMemo, useState } from "react";
import { BadgeCheck, Building2, Layers, Plus, Sparkles, Users } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import EmptyState from "@/shared/components/ui/EmptyState";
import ErrorState from "@/shared/components/ui/ErrorState";
import ModernButton from "@/shared/components/ui/ModernButton";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import {
  buildSegments,
  RoleCard,
  RoleDrawer,
  StatCard,
  type RoleFormState,
  type RoleLike,
} from "@/shared/components/roles/roleVisuals";
import ToastUtils from "@/utils/toastUtil";
import {
  useAccountTypes,
  useEntitlementCatalog,
  useCreateAccountType,
  useUpdateAccountType,
  useDeleteAccountType,
  type AccountScope,
  type AccountType,
} from "@/hooks/adminHooks/adminAccountTypeHooks";

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

const accent = "var(--theme-color)";

/** Map an account type onto the scope-agnostic shape the role visuals render. */
const toRoleLike = (type: AccountType): RoleLike => ({
  id: type.id,
  name: type.name,
  slug: type.slug,
  description: type.description ?? null,
  permissions: type.entitlements,
  is_system: type.is_system,
  member_count: type.account_count,
});

// ──────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────

const AdminAccountTypes: React.FC = () => {
  const [scope, setScope] = useState<AccountScope>("tenant");

  const { data: types, isLoading, isError, refetch } = useAccountTypes(scope);
  const { data: catalog } = useEntitlementCatalog();
  const createType = useCreateAccountType();
  const updateType = useUpdateAccountType(scope);
  const deleteType = useDeleteAccountType(scope);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AccountType | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AccountType | null>(null);

  const rows = useMemo<AccountType[]>(() => (Array.isArray(types) ? types : []), [types]);
  const catalogGroups = useMemo<[string, string[]][]>(
    () => Object.entries(catalog ?? {}),
    [catalog]
  );
  const totalEntitlements = useMemo(
    () => catalogGroups.reduce((sum, [, keys]) => sum + keys.length, 0),
    [catalogGroups]
  );

  const customCount = rows.filter((t) => !t.is_system).length;
  const systemCount = rows.length - customCount;
  const accountsAssigned = rows.reduce((sum, t) => sum + (t.account_count || 0), 0);

  const openCreate = useCallback(() => {
    setEditing(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((type: AccountType) => {
    setEditing(type);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditing(null);
  }, []);

  const saving = createType.isPending || updateType.isPending;

  const handleSubmit = useCallback(
    async (form: RoleFormState) => {
      const name = form.name.trim();
      if (name === "" || saving) return;
      const description = form.description.trim();
      const entitlements = Array.from(form.permissions);
      try {
        if (editing) {
          await updateType.mutateAsync({ id: editing.id, data: { name, description, entitlements } });
          ToastUtils.success(`Tier "${name}" updated`);
        } else {
          await createType.mutateAsync({ scope, name, description, entitlements });
          ToastUtils.success(`Tier "${name}" created`);
        }
        closeDrawer();
      } catch {
        ToastUtils.error(`Failed to ${editing ? "update" : "create"} tier`);
      }
    },
    [editing, saving, scope, updateType, createType, closeDrawer]
  );

  const handleDelete = useCallback(async () => {
    if (!pendingDelete || deleteType.isPending) return;
    const target = pendingDelete;
    try {
      await deleteType.mutateAsync(target.id);
      ToastUtils.success(`Tier "${target.name}" deleted`);
      setPendingDelete(null);
    } catch {
      ToastUtils.error("Failed to delete tier");
    }
  }, [pendingDelete, deleteType]);

  const headerActions = (
    <ModernButton variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
      Create tier
    </ModernButton>
  );

  const renderTiers = () => {
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
          title="Could not load account types"
          message="Something went wrong while fetching account types."
          onRetry={() => refetch()}
        />
      );
    }

    if (rows.length === 0) {
      return (
        <EmptyState
          icon={<BadgeCheck size={24} />}
          title="No tiers yet"
          description="Create a tier to bundle entitlements and assign them to accounts."
          action={headerActions}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((type) => (
          <RoleCard
            key={type.id}
            role={toRoleLike(type)}
            totalPermissions={totalEntitlements}
            segments={buildSegments(new Set(type.entitlements), catalogGroups)}
            itemNoun="entitlement"
            memberNoun="account"
            onEdit={() => openEdit(type)}
            onDelete={() => setPendingDelete(type)}
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
            title="Account Types"
            description="Bundle entitlements into tiers and assign them to tenant and client accounts."
            actions={headerActions}
          >
            {/* Summary stat tiles */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total tiers"
                value={rows.length}
                hint={`${customCount} custom · ${systemCount} system`}
                icon={<BadgeCheck size={18} />}
                loading={isLoading}
              />
              <StatCard
                label="Custom tiers"
                value={customCount}
                hint="Editable, team-defined"
                icon={<Sparkles size={18} />}
                loading={isLoading}
              />
              <StatCard
                label="Entitlements"
                value={totalEntitlements}
                hint={`across ${catalogGroups.length} groups`}
                icon={<Layers size={18} />}
              />
              <StatCard
                label="Accounts assigned"
                value={accountsAssigned}
                hint="With a tier attached"
                icon={<Users size={18} />}
                loading={isLoading}
              />
            </div>

            {/* Scope tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
              {([
                { key: "tenant" as const, label: "Tenant tiers", icon: <Users size={15} /> },
                { key: "client" as const, label: "Client tiers", icon: <Building2 size={15} /> },
              ]).map((t) => {
                const active = scope === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setScope(t.key)}
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

            {renderTiers()}
          </AdminPageShell>
        </main>
      </div>

      <RoleDrawer
        open={drawerOpen}
        editing={editing ? toRoleLike(editing) : null}
        catalog={catalog}
        totalPermissions={totalEntitlements}
        saving={saving}
        itemNoun="entitlement"
        namePlaceholder="e.g. Premium"
        entityNoun="tier"
        onClose={closeDrawer}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete tier"
        message={
          pendingDelete
            ? `Delete tier "${pendingDelete.name}"? Accounts assigned to it will lose its entitlements.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteType.isPending}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default AdminAccountTypes;
