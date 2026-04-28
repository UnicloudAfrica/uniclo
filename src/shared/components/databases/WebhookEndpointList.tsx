/**
 * WebhookEndpointList -- Manage webhook endpoint registrations.
 *
 * Lists registered endpoints with status, failure counts, and actions.
 * Includes inline create form and pause/resume/delete/test controls.
 */
import React, { useState, useMemo } from "react";
import {
  Webhook,
  Plus,
  RefreshCw,
  Trash2,
  Pause,
  Play,
  Send,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchWebhookEndpoints,
  useCreateWebhookEndpoint,
  useDeleteWebhookEndpoint,
  usePauseWebhookEndpoint,
  useResumeWebhookEndpoint,
  useTestWebhookEndpoint,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { WebhookEndpoint } from "@/types/managedDatabase";

// -- Event Type Categories --

const EVENT_CATEGORIES: Record<string, string[]> = {
  Database: [
    "database.created",
    "database.provisioned",
    "database.error",
    "database.deleted",
    "database.status_changed",
    "database.resized",
    "database.storage_increased",
  ],
  Backup: ["backup.created", "backup.completed", "backup.failed", "backup.restored"],
  Replica: ["replica.created", "replica.synced", "replica.promoted", "replica.error"],
  Alert: ["alert.fired", "alert.resolved"],
  User: ["user.created", "user.deleted", "password.rotated"],
  Maintenance: ["maintenance.scheduled", "maintenance.started", "maintenance.completed"],
};

// -- Status Badge --

const StatusBadge: React.FC<{ status: WebhookEndpoint["status"] }> = ({ status }) => {
  const config = {
    active: {
      icon: CheckCircle2,
      label: "Active",
      className:
        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
    },
    paused: {
      icon: Pause,
      label: "Paused",
      className:
        "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-500/20",
    },
    disabled: {
      icon: XCircle,
      label: "Disabled",
      className:
        "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-red-500/20",
    },
  }[status] ?? {
    icon: Clock,
    label: status,
    className: "bg-gray-100 text-gray-600 ring-gray-500/20",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
};

// -- Failure Indicator --

const FailureIndicator: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;

  const color =
    count >= 5
      ? "text-red-600 dark:text-red-400"
      : count >= 3
        ? "text-amber-600 dark:text-amber-400"
        : "text-gray-500 dark:text-gray-400";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <AlertTriangle size={12} />
      {count} failure{count !== 1 ? "s" : ""}
    </span>
  );
};

// -- Time Ago Helper --

const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// -- Create Form --

interface CreateFormProps {
  onClose: () => void;
}

const CreateForm: React.FC<CreateFormProps> = ({ onClose }) => {
  const createMutation = useCreateWebhookEndpoint();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["*"]);
  const [useWildcard, setUseWildcard] = useState(true);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleToggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleToggleCategory = (category: string) => {
    const categoryEvents = EVENT_CATEGORIES[category] ?? [];
    const allSelected = categoryEvents.every((e) => selectedEvents.includes(e));
    if (allSelected) {
      setSelectedEvents((prev) => prev.filter((e) => !categoryEvents.includes(e)));
    } else {
      setSelectedEvents((prev) => [...new Set([...prev, ...categoryEvents])]);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await createMutation.mutateAsync({
        url,
        description: description || undefined,
        events: useWildcard ? ["*"] : selectedEvents,
      });
      if ((result as Record<string, unknown>).secret) {
        setCreatedSecret((result as Record<string, unknown>).secret as string);
      } else {
        onClose();
      }
    } catch {
      // handled by mutation
    }
  };

  if (createdSecret) {
    return (
      <ModernCard className="border-emerald-200 dark:border-emerald-800">
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={18} />
            <h3 className="text-sm font-semibold">Webhook Endpoint Created</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Save this signing secret now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2">
            <code className="flex-1 text-xs font-mono break-all">
              {showSecret ? createdSecret : "whsec_" + "*".repeat(36)}
            </code>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(createdSecret)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Copy size={14} />
            </button>
          </div>
          <ModernButton variant="primary" size="sm" onClick={onClose}>
            Done
          </ModernButton>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard>
      <div className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Register Webhook Endpoint
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-app.com/webhooks/staqdb"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Production event handler"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Event Subscriptions
            </label>

            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useWildcard}
                onChange={(e) => {
                  setUseWildcard(e.target.checked);
                  if (e.target.checked) setSelectedEvents(["*"]);
                }}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                All events (wildcard)
              </span>
            </label>

            {!useWildcard && (
              <div className="space-y-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                {Object.entries(EVENT_CATEGORIES).map(([category, events]) => {
                  const allSelected = events.every((e) => selectedEvents.includes(e));
                  const someSelected = events.some((e) => selectedEvents.includes(e));
                  const isExpanded = expandedCategory === category;

                  return (
                    <div key={category}>
                      <button
                        onClick={() =>
                          setExpandedCategory(isExpanded ? null : category)
                        }
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={() => handleToggleCategory(category)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                          />
                          {category}
                        </label>
                        {isExpanded ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="ml-6 space-y-0.5 pb-1">
                          {events.map((event) => (
                            <label
                              key={event}
                              className="flex items-center gap-2 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <input
                                type="checkbox"
                                checked={selectedEvents.includes(event)}
                                onChange={() => handleToggleEvent(event)}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                              />
                              <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400">
                                {event}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <ModernButton
            variant="primary"
            size="sm"
            loading={createMutation.isPending}
            disabled={!url || (!useWildcard && selectedEvents.length === 0)}
            onClick={handleSubmit}
          >
            <Plus size={14} className="mr-1" />
            Register Endpoint
          </ModernButton>
          <ModernButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </ModernButton>
        </div>
      </div>
    </ModernCard>
  );
};

// -- Main Component --

interface WebhookEndpointListProps {
  context: "admin" | "tenant" | "client";
  onSelectEndpoint?: (endpointId: number) => void;
}

const WebhookEndpointList: React.FC<WebhookEndpointListProps> = ({
  _context,
  onSelectEndpoint,
}) => {
  const { data: endpointsRaw, isLoading, refetch } = useFetchWebhookEndpoints();
  const deleteMutation = useDeleteWebhookEndpoint();
  const pauseMutation = usePauseWebhookEndpoint();
  const resumeMutation = useResumeWebhookEndpoint();
  const testMutation = useTestWebhookEndpoint();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const endpoints = useMemo(() => {
    const list = Array.isArray(endpointsRaw)
      ? (endpointsRaw as WebhookEndpoint[])
      : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (ep) =>
        ep.url.toLowerCase().includes(q) ||
        (ep.description ?? "").toLowerCase().includes(q)
    );
  }, [endpointsRaw, searchQuery]);

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDeleteId(null);
    } catch {
      // handled by mutation
    }
  };

  // -- Loading --
  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading webhook endpoints...
        </p>
      </div>
    );
  }

  // -- Empty State --
  if (!endpoints.length && !searchQuery && !showCreateForm) {
    return (
      <div className="space-y-4">
        <ModernCard className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
            <Webhook className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Webhook Endpoints
          </h3>
          <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400 mb-6">
            Register webhook endpoints to receive real-time notifications when database
            events occur. Events are signed with HMAC-SHA256 for verification.
          </p>
          <ModernButton variant="primary" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-1.5" />
            Register Endpoint
          </ModernButton>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </ModernButton>
          <ModernButton
            variant="primary"
            size="sm"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={14} className="mr-1" />
            Register Endpoint
          </ModernButton>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <CreateForm
          onClose={() => {
            setShowCreateForm(false);
            refetch();
          }}
        />
      )}

      {/* Endpoint Cards */}
      <div className="space-y-3">
        {endpoints.map((endpoint) => {
          const isDeleting = confirmDeleteId === endpoint.id;

          return (
            <ModernCard
              key={endpoint.id}
              className={`transition-all duration-200 hover:shadow-md ${
                endpoint.status === "disabled"
                  ? "ring-1 ring-red-200 dark:ring-red-800 opacity-75"
                  : ""
              }`}
            >
              <div className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
                        {endpoint.url}
                      </code>
                    </div>
                    {endpoint.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {endpoint.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <FailureIndicator count={endpoint.failure_count} />
                    <StatusBadge status={endpoint.status} />
                  </div>
                </div>

                {/* Event subscriptions */}
                <div className="flex flex-wrap gap-1">
                  {(endpoint.events ?? []).map((event) => (
                    <span
                      key={event}
                      className="inline-flex rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-mono text-gray-600 dark:text-gray-400"
                    >
                      {event}
                    </span>
                  ))}
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>
                      Last delivery: {timeAgo(endpoint.last_delivery_at)}
                    </span>
                  </div>
                  {endpoint.last_failure_at && (
                    <div className="flex items-center gap-1">
                      <XCircle size={11} />
                      <span>Last failure: {timeAgo(endpoint.last_failure_at)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isDeleting ? (
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Delete this webhook endpoint?
                    </p>
                    <div className="flex gap-2">
                      <ModernButton
                        variant="danger"
                        size="xs"
                        loading={deleteMutation.isPending}
                        onClick={() => handleDelete(endpoint.id)}
                      >
                        Confirm Delete
                      </ModernButton>
                      <ModernButton
                        variant="ghost"
                        size="xs"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                    {endpoint.status === "active" && (
                      <ModernButton
                        variant="outline"
                        size="xs"
                        loading={pauseMutation.isPending}
                        onClick={() => pauseMutation.mutate(endpoint.id)}
                      >
                        <Pause size={12} className="mr-1" />
                        Pause
                      </ModernButton>
                    )}
                    {(endpoint.status === "paused" || endpoint.status === "disabled") && (
                      <ModernButton
                        variant="outline"
                        size="xs"
                        loading={resumeMutation.isPending}
                        onClick={() => resumeMutation.mutate(endpoint.id)}
                      >
                        <Play size={12} className="mr-1" />
                        Resume
                      </ModernButton>
                    )}
                    {endpoint.status === "active" && (
                      <ModernButton
                        variant="outline"
                        size="xs"
                        loading={testMutation.isPending}
                        onClick={() => testMutation.mutate(endpoint.id)}
                      >
                        <Send size={12} className="mr-1" />
                        Send Test
                      </ModernButton>
                    )}
                    {onSelectEndpoint && (
                      <ModernButton
                        variant="ghost"
                        size="xs"
                        onClick={() => onSelectEndpoint(endpoint.id)}
                      >
                        Delivery Log
                      </ModernButton>
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => setConfirmDeleteId(endpoint.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </ModernCard>
          );
        })}
      </div>

      {/* Search no results */}
      {searchQuery && endpoints.length === 0 && (
        <ModernCard className="py-10 text-center">
          <Search size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">
            No endpoints matching &quot;{searchQuery}&quot;
          </p>
        </ModernCard>
      )}
    </div>
  );
};

export default WebhookEndpointList;
