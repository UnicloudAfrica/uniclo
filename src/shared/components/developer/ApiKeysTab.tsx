import { useState } from "react";
import {
  Plus,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Shield,
  Clock,
  Globe2,
  AlertTriangle,
  Loader2,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import {
  useFetchApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useRotateApiKey,
  useFetchAvailableScopes,
  type ApiKeyData,
  type CreateApiKeyPayload,
} from "@/hooks/developerHooks";

interface ApiKeysTabProps {
  context: "admin" | "tenant" | "client";
}

const ApiKeysTab = ({ _context }: ApiKeysTabProps) => {
  const { data: keys = [], isLoading } = useFetchApiKeys();
  const { data: scopeGroups = {} } = useFetchAvailableScopes();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();
  const rotateMutation = useRotateApiKey();

  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [rotatedToken, setRotatedToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<number | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<number | null>(null);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formMode, setFormMode] = useState<"live" | "test">("live");
  const [formDescription, setFormDescription] = useState("");
  const [formScopes, setFormScopes] = useState<string[]>([]);
  const [formExpiry, setFormExpiry] = useState("");
  const [formIps, setFormIps] = useState("");

  const activeKeys = (keys as ApiKeyData[]).filter((k) => k.is_active && !k.revoked_at);
  const revokedKeys = (keys as ApiKeyData[]).filter((k) => !k.is_active || k.revoked_at);

  const handleCreate = async () => {
    const payload: CreateApiKeyPayload = {
      name: formName,
      mode: formMode,
      scopes: formScopes.length > 0 ? formScopes : ["instances:read"],
    };
    if (formDescription) payload.description = formDescription;
    if (formExpiry) payload.expires_at = formExpiry;
    if (formIps.trim()) {
      payload.allowed_ips = formIps
        .split("\n")
        .map((ip) => ip.trim())
        .filter(Boolean);
    }

    const result = await createMutation.mutateAsync(payload);
    if (result.plain_text_token) {
      setNewToken(result.plain_text_token);
      setShowCreate(false);
      resetForm();
    }
  };

  const handleRotate = async (keyId: number) => {
    const result = await rotateMutation.mutateAsync(keyId);
    if (result.plain_text_token) {
      setRotatedToken(result.plain_text_token);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setFormName("");
    setFormMode("live");
    setFormDescription("");
    setFormScopes([]);
    setFormExpiry("");
    setFormIps("");
  };

  const toggleScope = (scope: string) => {
    setFormScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: designTokens.colors.primary[500] }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Reveal Banner */}
      {(newToken || rotatedToken) && (
        <div
          className="rounded-xl border-2 p-5"
          style={{
            borderColor: designTokens.colors.warning[400],
            backgroundColor: designTokens.colors.warning[50],
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" style={{ color: designTokens.colors.warning[600] }} />
            <h3 className="font-bold" style={{ color: designTokens.colors.warning[800] }}>
              {newToken ? "Your API Key" : "Rotated API Key"} — Copy it now!
            </h3>
          </div>
          <p className="mb-3 text-sm" style={{ color: designTokens.colors.warning[700] }}>
            This token will only be shown once. Store it securely.
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded-lg border px-4 py-2.5 font-mono text-sm break-all"
              style={{
                backgroundColor: designTokens.colors.neutral[900],
                color: designTokens.colors.success[400],
                borderColor: designTokens.colors.neutral[700],
              }}
            >
              {newToken || rotatedToken}
            </code>
            <button
              onClick={() => handleCopy((newToken || rotatedToken)!, "new-token")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
              style={{
                backgroundColor: copiedId === "new-token" ? designTokens.colors.success[500] : designTokens.colors.primary[600],
                color: "#fff",
              }}
            >
              {copiedId === "new-token" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={() => { setNewToken(null); setRotatedToken(null); }}
            className="mt-3 text-xs font-medium underline"
            style={{ color: designTokens.colors.warning[700] }}
          >
            I've saved it — dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
            API Keys ({activeKeys.length})
          </h2>
          <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>
            Manage API keys for programmatic access to UniCloud
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg"
          style={{ backgroundColor: designTokens.colors.primary[600] }}
        >
          <Plus className="h-4 w-4" />
          Create API Key
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div
          className="rounded-xl border p-6 shadow-sm"
          style={{ borderColor: designTokens.colors.primary[200], backgroundColor: designTokens.colors.primary[50] }}
        >
          <h3 className="mb-4 text-base font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
            Create New API Key
          </h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. CI/CD Pipeline"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: designTokens.colors.neutral[300] }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                  Environment *
                </label>
                <div className="flex gap-2">
                  {(["live", "test"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormMode(m)}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all"
                      style={{
                        borderColor: formMode === m
                          ? m === "live" ? designTokens.colors.success[500] : designTokens.colors.warning[500]
                          : designTokens.colors.neutral[300],
                        backgroundColor: formMode === m
                          ? m === "live" ? designTokens.colors.success[50] : designTokens.colors.warning[50]
                          : "#fff",
                        color: formMode === m
                          ? m === "live" ? designTokens.colors.success[700] : designTokens.colors.warning[700]
                          : designTokens.colors.neutral[500],
                      }}
                    >
                      {m === "live" ? "Live" : "Test / Sandbox"}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px]" style={{ color: designTokens.colors.neutral[400] }}>
                  {formMode === "test"
                    ? "Test keys work in sandbox mode — no real provisioning or charges."
                    : "Live keys operate on production resources and billing."}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                  Expiry (optional)
                </label>
                <input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: designTokens.colors.neutral[300] }}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                Description (optional)
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What is this key for?"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: designTokens.colors.neutral[300] }}
              />
            </div>

            {/* Scopes */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                  Permissions *
                </label>
                {(() => {
                  const allScopes = Object.values(scopeGroups).flatMap((g) => Object.keys(g as Record<string, string>));
                  const allSelected = allScopes.length > 0 && allScopes.every((s) => formScopes.includes(s));
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (allSelected) {
                          setFormScopes([]);
                        } else {
                          setFormScopes(allScopes);
                        }
                      }}
                      className="rounded-md px-3 py-1 text-[11px] font-semibold transition-colors"
                      style={{
                        backgroundColor: allSelected ? designTokens.colors.primary[100] : designTokens.colors.neutral[100],
                        color: allSelected ? designTokens.colors.primary[700] : designTokens.colors.neutral[600],
                      }}
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  );
                })()}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(scopeGroups).map(([group, scopes]) => {
                  const groupScopes = Object.keys(scopes as Record<string, string>);
                  const allGroupSelected = groupScopes.every((s) => formScopes.includes(s));
                  const someGroupSelected = groupScopes.some((s) => formScopes.includes(s));
                  return (
                    <div
                      key={group}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: someGroupSelected ? designTokens.colors.primary[200] : designTokens.colors.neutral[200],
                        backgroundColor: someGroupSelected ? designTokens.colors.primary[25] ?? "#fafcff" : "#fff",
                      }}
                    >
                      <label className="mb-2 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allGroupSelected}
                          ref={(el) => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                          onChange={() => {
                            if (allGroupSelected) {
                              setFormScopes((prev) => prev.filter((s) => !groupScopes.includes(s)));
                            } else {
                              setFormScopes((prev) => [...new Set([...prev, ...groupScopes])]);
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: designTokens.colors.neutral[600] }}>
                          {group}
                        </span>
                      </label>
                      {Object.entries(scopes as Record<string, string>).map(([scope, desc]) => (
                        <label key={scope} className="flex items-start gap-2 py-1 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formScopes.includes(scope)}
                            onChange={() => toggleScope(scope)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
                          />
                          <span style={{ color: designTokens.colors.neutral[700] }}>{desc}</span>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* IP Allowlist */}
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                IP Allowlist (optional, one per line)
              </label>
              <textarea
                value={formIps}
                onChange={(e) => setFormIps(e.target.value)}
                placeholder={"192.168.1.1\n10.0.0.0/8"}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
                style={{ borderColor: designTokens.colors.neutral[300] }}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCreate(false); resetForm(); }}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: designTokens.colors.neutral[300], color: designTokens.colors.neutral[600] }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formName || formScopes.length === 0 || createMutation.isPending}
                className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: designTokens.colors.primary[600] }}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Keys */}
      {activeKeys.length === 0 && !showCreate ? (
        <div
          className="rounded-xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: designTokens.colors.neutral[200] }}
        >
          <KeyRound className="mx-auto mb-3 h-10 w-10" style={{ color: designTokens.colors.neutral[300] }} />
          <h3 className="text-base font-semibold" style={{ color: designTokens.colors.neutral[600] }}>
            No API keys yet
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: designTokens.colors.neutral[400] }}>
            Create an API key to start using the UniCloud API programmatically
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: designTokens.colors.primary[600] }}
          >
            <Plus className="h-4 w-4" />
            Create your first key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeKeys.map((key) => (
            <div
              key={key.id}
              className="rounded-xl border transition-shadow hover:shadow-md"
              style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: "#fff" }}
            >
              {/* Key Header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                onClick={() => setExpandedKey(expandedKey === key.id ? null : key.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: designTokens.colors.primary[100] }}
                  >
                    <KeyRound className="h-5 w-5" style={{ color: designTokens.colors.primary[600] }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                        {key.name}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: key.mode === "test" ? designTokens.colors.warning[100] : designTokens.colors.success[100],
                          color: key.mode === "test" ? designTokens.colors.warning[700] : designTokens.colors.success[700],
                        }}
                      >
                        {key.mode === "test" ? "Test" : "Live"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: designTokens.colors.neutral[400] }}>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {key.scopes.length} {key.scopes.length === 1 ? "scope" : "scopes"}
                      </span>
                      {key.last_used_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last used {new Date(key.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                      {key.allowed_ips && key.allowed_ips.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Globe2 className="h-3 w-3" />
                          {key.allowed_ips.length} IP{key.allowed_ips.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRotate(key.id); }}
                    disabled={rotateMutation.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ borderColor: designTokens.colors.neutral[200] }}
                    title="Rotate key"
                  >
                    <RotateCcw className="h-3.5 w-3.5" style={{ color: designTokens.colors.neutral[500] }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirmRevoke === key.id) {
                        revokeMutation.mutate(key.id);
                        setConfirmRevoke(null);
                      } else {
                        setConfirmRevoke(key.id);
                        setTimeout(() => setConfirmRevoke(null), 3000);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
                    style={{
                      borderColor: confirmRevoke === key.id ? designTokens.colors.error[400] : designTokens.colors.neutral[200],
                      backgroundColor: confirmRevoke === key.id ? designTokens.colors.error[50] : undefined,
                    }}
                    title={confirmRevoke === key.id ? "Click again to confirm" : "Revoke key"}
                  >
                    <Trash2
                      className="h-3.5 w-3.5"
                      style={{ color: confirmRevoke === key.id ? designTokens.colors.error[600] : designTokens.colors.neutral[500] }}
                    />
                  </button>
                  {expandedKey === key.id ? (
                    <ChevronUp className="h-4 w-4" style={{ color: designTokens.colors.neutral[400] }} />
                  ) : (
                    <ChevronDown className="h-4 w-4" style={{ color: designTokens.colors.neutral[400] }} />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedKey === key.id && (
                <div
                  className="border-t px-5 py-4"
                  style={{ borderColor: designTokens.colors.neutral[100], backgroundColor: designTokens.colors.neutral[50] }}
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: designTokens.colors.neutral[400] }}>
                        Scopes
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-md px-2 py-0.5 font-mono text-[11px]"
                            style={{ backgroundColor: designTokens.colors.primary[100], color: designTokens.colors.primary[700] }}
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: designTokens.colors.neutral[400] }}>
                        Rate Limit
                      </div>
                      <div className="mt-1 text-sm font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                        {key.rate_limit_tier === "standard" && "60 req/min"}
                        {key.rate_limit_tier === "professional" && "120 req/min"}
                        {key.rate_limit_tier === "enterprise" && "300 req/min"}
                        <span className="ml-1 text-xs font-normal capitalize" style={{ color: designTokens.colors.neutral[400] }}>
                          ({key.rate_limit_tier})
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: designTokens.colors.neutral[400] }}>
                        Created
                      </div>
                      <div className="mt-1 text-sm" style={{ color: designTokens.colors.neutral[700] }}>
                        {new Date(key.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {key.expires_at && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: designTokens.colors.neutral[400] }}>
                          Expires
                        </div>
                        <div className="mt-1 text-sm" style={{ color: designTokens.colors.warning[600] }}>
                          {new Date(key.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {key.allowed_ips && key.allowed_ips.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: designTokens.colors.neutral[400] }}>
                          Allowed IPs
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {key.allowed_ips.map((ip) => (
                            <span
                              key={ip}
                              className="rounded-md px-2 py-0.5 font-mono text-[11px]"
                              style={{ backgroundColor: designTokens.colors.neutral[200], color: designTokens.colors.neutral[700] }}
                            >
                              {ip}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {key.description && (
                      <div className="sm:col-span-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: designTokens.colors.neutral[400] }}>
                          Description
                        </div>
                        <div className="mt-1 text-sm" style={{ color: designTokens.colors.neutral[600] }}>
                          {key.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Revoked Keys (collapsed) */}
      {revokedKeys.length > 0 && (
        <details className="group">
          <summary
            className="cursor-pointer text-sm font-medium"
            style={{ color: designTokens.colors.neutral[400] }}
          >
            {revokedKeys.length} revoked key{revokedKeys.length > 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-2">
            {revokedKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 opacity-50"
                style={{ borderColor: designTokens.colors.neutral[200] }}
              >
                <KeyRound className="h-4 w-4" style={{ color: designTokens.colors.neutral[400] }} />
                <span className="text-sm line-through" style={{ color: designTokens.colors.neutral[500] }}>
                  {key.name}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{ backgroundColor: designTokens.colors.error[100], color: designTokens.colors.error[600] }}
                >
                  Revoked
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default ApiKeysTab;
