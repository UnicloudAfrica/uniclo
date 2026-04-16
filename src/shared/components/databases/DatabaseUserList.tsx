/**
 * DatabaseUserList -- Manage database-level users: create, list, rotate passwords, delete.
 * Includes master password rotation in a danger zone section.
 */
import React, { useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Key,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield,
  X,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchDatabaseUsers,
  useCreateDatabaseUser,
  useDeleteDatabaseUser,
  useRotateDatabaseUserPassword,
  useRotateDatabaseMasterPassword,
} from "@/shared/hooks/resources/managedDatabaseHooks";

// ─── Types ───────────────────────────────────────────────────────

interface DatabaseUser {
  id: number;
  database_id: number;
  username: string;
  role: "admin" | "readwrite" | "readonly" | "replication";
  status: "active" | "suspended" | "deleted";
  password_rotated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DatabaseUserListProps {
  databaseId: string | number;
}

// ─── Role Badges ─────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  admin: {
    label: "Admin",
    bg: "bg-red-100 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-300",
  },
  readwrite: {
    label: "Read/Write",
    bg: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  readonly: {
    label: "Read Only",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
  },
  replication: {
    label: "Replication",
    bg: "bg-purple-100 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
  },
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.readonly;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

// ─── Copy Button ─────────────────────────────────────────────────

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

// ─── Password Reveal Modal ───────────────────────────────────────

const PasswordRevealModal: React.FC<{
  password: string;
  username: string;
  onClose: () => void;
}> = ({ password, username, onClose }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-3 rounded-t-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              New Password for "{username}"
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
              This password will only be shown once. Copy it now and store it securely.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                {visible ? password : "\u2022".repeat(32)}
              </code>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setVisible(!visible)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <CopyButton text={password} />
              </div>
            </div>
          </div>

          <ModernButton variant="primary" className="w-full" onClick={onClose}>
            I've Saved the Password
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

// ─── Create User Form ────────────────────────────────────────────

const CreateUserForm: React.FC<{
  databaseId: string | number;
  onClose: () => void;
}> = ({ databaseId, onClose }) => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<string>("readwrite");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const createMutation = useCreateDatabaseUser();

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pw = "";
    for (let i = 0; i < 24; i++) {
      pw += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(pw);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      await createMutation.mutateAsync({
        identifier: databaseId,
        username,
        role,
        password,
      });
      onClose();
    } catch {
      // handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Create Database User</h4>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="app_user"
            pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
            maxLength={63}
            required
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
          >
            <option value="admin">Admin</option>
            <option value="readwrite">Read/Write</option>
            <option value="readonly">Read Only</option>
            <option value="replication">Replication</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 12 characters"
              minLength={12}
              maxLength={128}
              required
              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 pr-9 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <ModernButton type="button" variant="ghost" size="sm" onClick={generatePassword}>
            <Key size={13} className="mr-1" />
            Generate
          </ModernButton>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <ModernButton type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </ModernButton>
        <ModernButton
          type="submit"
          variant="primary"
          size="sm"
          loading={createMutation.isPending}
          disabled={!username || !password || password.length < 12}
        >
          <UserPlus size={13} className="mr-1" />
          Create User
        </ModernButton>
      </div>
    </form>
  );
};

// ─── Main Component ──────────────────────────────────────────────

const DatabaseUserList: React.FC<DatabaseUserListProps> = ({ databaseId }) => {
  const { data: usersRaw, isLoading } = useFetchDatabaseUsers(databaseId);
  const deleteMutation = useDeleteDatabaseUser();
  const rotateUserPwMutation = useRotateDatabaseUserPassword();
  const rotateMasterPwMutation = useRotateDatabaseMasterPassword();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [rotatedPassword, setRotatedPassword] = useState<{ password: string; username: string } | null>(null);
  const [showMasterConfirm, setShowMasterConfirm] = useState(false);

  const users = Array.isArray(usersRaw) ? (usersRaw as DatabaseUser[]) : [];

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteMutation.mutateAsync({ identifier: databaseId, userId });
      setConfirmDeleteId(null);
    } catch {
      // handled by mutation
    }
  };

  const handleRotatePassword = async (user: DatabaseUser) => {
    try {
      const result = await rotateUserPwMutation.mutateAsync({
        identifier: databaseId,
        userId: user.id,
      });
      const data = result as Record<string, unknown>;
      if (data?.password) {
        setRotatedPassword({ password: data.password as string, username: user.username });
      }
    } catch {
      // handled by mutation
    }
  };

  const handleRotateMasterPassword = async () => {
    try {
      const result = await rotateMasterPwMutation.mutateAsync({ identifier: databaseId });
      const data = result as Record<string, unknown>;
      if (data?.password) {
        setRotatedPassword({ password: data.password as string, username: "Master Admin" });
      }
      setShowMasterConfirm(false);
    } catch {
      // handled by mutation
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading database users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Password Reveal Modal */}
      {rotatedPassword && (
        <PasswordRevealModal
          password={rotatedPassword.password}
          username={rotatedPassword.username}
          onClose={() => setRotatedPassword(null)}
        />
      )}

      {/* User List Card */}
      <ModernCard padding="none" className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-violet-500" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <Users size={16} className="text-blue-500" />
              Database Users
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                {users.length}
              </span>
            </div>
            {!showCreateForm && (
              <ModernButton variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
                <UserPlus size={13} className="mr-1" />
                Add User
              </ModernButton>
            )}
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <CreateUserForm databaseId={databaseId} onClose={() => setShowCreateForm(false)} />
          )}

          {/* User Rows */}
          {users.length === 0 && !showCreateForm ? (
            <div className="py-8 text-center">
              <Users size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No database users yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Create a user to connect to your database with scoped permissions.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">
                        {user.username}
                      </span>
                      <RoleBadge role={user.role} />
                      {user.status === "suspended" && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Password rotated: {formatDate(user.password_rotated_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <ModernButton
                      variant="ghost"
                      size="xs"
                      onClick={() => handleRotatePassword(user)}
                      loading={rotateUserPwMutation.isPending}
                      title="Rotate password"
                    >
                      <RefreshCw size={13} />
                    </ModernButton>

                    {confirmDeleteId === user.id ? (
                      <div className="flex items-center gap-1">
                        <ModernButton
                          variant="danger"
                          size="xs"
                          onClick={() => handleDeleteUser(user.id)}
                          loading={deleteMutation.isPending}
                        >
                          Confirm
                        </ModernButton>
                        <ModernButton
                          variant="ghost"
                          size="xs"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </ModernButton>
                      </div>
                    ) : (
                      <ModernButton
                        variant="ghost"
                        size="xs"
                        onClick={() => setConfirmDeleteId(user.id)}
                        title="Delete user"
                      >
                        <Trash2 size={13} className="text-red-400" />
                      </ModernButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModernCard>

      {/* Master Password Danger Zone */}
      <ModernCard className="border-red-200 dark:border-red-800 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
          <Shield size={16} />
          Danger Zone
        </div>

        {showMasterConfirm ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Rotate Master Password?
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  This will immediately change the admin password. All existing connections using the
                  current password will be disconnected. Make sure to update your application
                  configuration.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <ModernButton
                variant="danger"
                size="sm"
                loading={rotateMasterPwMutation.isPending}
                onClick={handleRotateMasterPassword}
              >
                <Key size={13} className="mr-1" />
                Rotate Master Password
              </ModernButton>
              <ModernButton variant="ghost" size="sm" onClick={() => setShowMasterConfirm(false)}>
                Cancel
              </ModernButton>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rotate the master admin password for this database.
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                All connections using the current password will be disconnected.
              </p>
            </div>
            <ModernButton variant="danger" size="sm" onClick={() => setShowMasterConfirm(true)}>
              <Key size={13} className="mr-1" />
              Rotate
            </ModernButton>
          </div>
        )}
      </ModernCard>
    </div>
  );
};

export default DatabaseUserList;
