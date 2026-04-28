import { useState } from "react";
import {
  Plus,
  Webhook,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Trash2,
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import {
  useFetchWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useFetchWebhookEvents,
  type WebhookEndpointData,
} from "@/hooks/developerHooks";

interface WebhooksTabProps {
  context: "admin" | "tenant" | "client";
}

const WebhooksTab = ({ _context }: WebhooksTabProps) => {
  const { data: webhooks = [], isLoading } = useFetchWebhooks();
  const { data: availableEvents = {} } = useFetchWebhookEvents();
  const createMutation = useCreateWebhook();
  const updateMutation = useUpdateWebhook();
  const deleteMutation = useDeleteWebhook();
  const testMutation = useTestWebhook();

  const [showCreate, setShowCreate] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; success: boolean } | null>(null);

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      url: formUrl,
      description: formDesc || undefined,
      events: formEvents.length > 0 ? formEvents : ["*"],
    });
    setShowCreate(false);
    setFormUrl("");
    setFormDesc("");
    setFormEvents([]);
  };

  const handleTest = async (id: number) => {
    const result = await testMutation.mutateAsync(id);
    setTestResult({ id, success: result?.status === "success" });
    setTimeout(() => setTestResult(null), 3000);
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: designTokens.colors.primary[500] }} />
      </div>
    );
  }

  const endpoints = webhooks as WebhookEndpointData[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
            Webhooks ({endpoints.length})
          </h2>
          <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>
            Receive real-time notifications when events happen in your account
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: designTokens.colors.primary[600] }}
        >
          <Plus className="h-4 w-4" />
          Add Endpoint
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div
          className="rounded-xl border p-6 shadow-sm"
          style={{ borderColor: designTokens.colors.primary[200], backgroundColor: designTokens.colors.primary[50] }}
        >
          <h3 className="mb-4 text-base font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
            New Webhook Endpoint
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                Endpoint URL *
              </label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://your-app.com/webhooks/unicloud"
                className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
                style={{ borderColor: designTokens.colors.neutral[300] }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                Description (optional)
              </label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Production event handler"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: designTokens.colors.neutral[300] }}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
                Events to subscribe (leave empty for all)
              </label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(availableEvents as Record<string, string>).map(([event, desc]) => (
                  <label
                    key={event}
                    className="flex items-start gap-2 rounded-lg border p-2 cursor-pointer transition-colors hover:border-primary-300"
                    style={{
                      borderColor: formEvents.includes(event)
                        ? designTokens.colors.primary[400]
                        : designTokens.colors.neutral[200],
                      backgroundColor: formEvents.includes(event) ? designTokens.colors.primary[50] : "#fff",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
                    />
                    <div>
                      <div className="font-mono text-xs font-medium" style={{ color: designTokens.colors.neutral[800] }}>
                        {event}
                      </div>
                      <div className="text-[10px]" style={{ color: designTokens.colors.neutral[500] }}>
                        {desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCreate(false); setFormUrl(""); setFormDesc(""); setFormEvents([]); }}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: designTokens.colors.neutral[300], color: designTokens.colors.neutral[600] }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formUrl || createMutation.isPending}
                className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: designTokens.colors.primary[600] }}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Endpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Endpoints List */}
      {endpoints.length === 0 && !showCreate ? (
        <div
          className="rounded-xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: designTokens.colors.neutral[200] }}
        >
          <Webhook className="mx-auto mb-3 h-10 w-10" style={{ color: designTokens.colors.neutral[300] }} />
          <h3 className="text-base font-semibold" style={{ color: designTokens.colors.neutral[600] }}>
            No webhook endpoints
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: designTokens.colors.neutral[400] }}>
            Add a webhook endpoint to receive real-time event notifications
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div
              key={ep.id}
              className="rounded-xl border transition-shadow hover:shadow-md"
              style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: "#fff" }}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: ep.is_active ? designTokens.colors.success[100] : designTokens.colors.neutral[100],
                    }}
                  >
                    <Webhook
                      className="h-5 w-5"
                      style={{
                        color: ep.is_active ? designTokens.colors.success[600] : designTokens.colors.neutral[400],
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate font-mono text-sm font-medium"
                        style={{ color: designTokens.colors.neutral[900] }}
                      >
                        {ep.url}
                      </span>
                      {ep.failure_count >= 5 && (
                        <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: designTokens.colors.warning[500] }} />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: designTokens.colors.neutral[400] }}>
                      <span className="flex flex-wrap gap-1">
                        {ep.events.slice(0, 3).map((e) => (
                          <span
                            key={e}
                            className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                            style={{ backgroundColor: designTokens.colors.neutral[100] }}
                          >
                            {e}
                          </span>
                        ))}
                        {ep.events.length > 3 && (
                          <span className="text-[10px]">+{ep.events.length - 3} more</span>
                        )}
                      </span>
                      {ep.last_triggered_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ep.last_triggered_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Test result indicator */}
                  {testResult?.id === ep.id && (
                    testResult.success ? (
                      <CheckCircle2 className="h-4 w-4" style={{ color: designTokens.colors.success[500] }} />
                    ) : (
                      <XCircle className="h-4 w-4" style={{ color: designTokens.colors.error[500] }} />
                    )
                  )}
                  <button
                    onClick={() => handleTest(ep.id)}
                    disabled={testMutation.isPending}
                    className="flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-gray-50"
                    style={{ borderColor: designTokens.colors.neutral[200], color: designTokens.colors.neutral[600] }}
                    title="Send test event"
                  >
                    <Send className="h-3 w-3" />
                    Test
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: ep.id, is_active: !ep.is_active })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ borderColor: designTokens.colors.neutral[200] }}
                    title={ep.is_active ? "Disable" : "Enable"}
                  >
                    {ep.is_active ? (
                      <ToggleRight className="h-4 w-4" style={{ color: designTokens.colors.success[500] }} />
                    ) : (
                      <ToggleLeft className="h-4 w-4" style={{ color: designTokens.colors.neutral[400] }} />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirmDelete === ep.id) {
                        deleteMutation.mutate(ep.id);
                        setConfirmDelete(null);
                      } else {
                        setConfirmDelete(ep.id);
                        setTimeout(() => setConfirmDelete(null), 3000);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
                    style={{
                      borderColor: confirmDelete === ep.id ? designTokens.colors.error[400] : designTokens.colors.neutral[200],
                    }}
                    title={confirmDelete === ep.id ? "Click again to confirm" : "Delete"}
                  >
                    <Trash2
                      className="h-3.5 w-3.5"
                      style={{ color: confirmDelete === ep.id ? designTokens.colors.error[600] : designTokens.colors.neutral[500] }}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebhooksTab;
