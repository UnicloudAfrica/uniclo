/**
 * WebhookDeliveryLog -- Delivery history for a specific webhook endpoint.
 *
 * Shows status, event type, response code, attempt count, and timestamps.
 * Expandable rows reveal full payload and response body.
 */
import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchWebhookDeliveries,
  useRetryWebhookDelivery,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { WebhookDelivery } from "@/types/managedDatabase";

// -- Status Icon --

const DeliveryStatusIcon: React.FC<{ status: WebhookDelivery["status"] }> = ({
  status,
}) => {
  switch (status) {
    case "success":
      return <CheckCircle2 size={16} className="text-emerald-500" />;
    case "failed":
      return <XCircle size={16} className="text-red-500" />;
    case "pending":
    default:
      return <Clock size={16} className="text-amber-500" />;
  }
};

// -- JSON Viewer --

const JsonViewer: React.FC<{ data: unknown; label: string }> = ({ data, label }) => {
  if (!data) return null;

  return (
    <div className="space-y-1">
      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <pre className="rounded-lg bg-gray-900 dark:bg-gray-950 p-3 text-xs text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

// -- Delivery Row --

interface DeliveryRowProps {
  delivery: WebhookDelivery;
  onRetry: (id: number) => void;
  isRetrying: boolean;
}

const DeliveryRow: React.FC<DeliveryRowProps> = ({ delivery, onRetry, isRetrying }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* Summary Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <DeliveryStatusIcon status={delivery.status} />

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
            {delivery.event_type}
          </span>
        </span>

        {delivery.response_code && (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-mono ${
              delivery.response_code >= 200 && delivery.response_code < 300
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            }`}
          >
            {delivery.response_code}
          </span>
        )}

        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          Attempt {delivery.attempt}
        </span>

        <span className="text-xs text-gray-400 dark:text-gray-500 w-32 text-right tabular-nums">
          {delivery.created_at
            ? new Date(delivery.created_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--"}
        </span>

        {expanded ? (
          <ChevronUp size={14} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-gray-400 shrink-0" />
        )}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Meta details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Event ID</span>
              <p className="font-mono text-gray-700 dark:text-gray-300 truncate">
                {delivery.event_id}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Delivered At</span>
              <p className="text-gray-700 dark:text-gray-300">
                {delivery.delivered_at
                  ? new Date(delivery.delivered_at).toLocaleString()
                  : "--"}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Next Retry</span>
              <p className="text-gray-700 dark:text-gray-300">
                {delivery.next_retry_at
                  ? new Date(delivery.next_retry_at).toLocaleString()
                  : "--"}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Status</span>
              <p
                className={`font-medium ${
                  delivery.status === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : delivery.status === "failed"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {delivery.status}
              </p>
            </div>
          </div>

          {/* Error message */}
          {delivery.error_message && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 px-3 py-2">
              <p className="text-xs text-red-600 dark:text-red-400">
                {delivery.error_message}
              </p>
            </div>
          )}

          {/* Payload */}
          <JsonViewer data={delivery.payload} label="Request Payload" />

          {/* Response */}
          {delivery.response_body && (
            <JsonViewer data={delivery.response_body} label="Response Body" />
          )}

          {/* Retry Action */}
          {delivery.status === "failed" && (
            <div className="pt-1">
              <ModernButton
                variant="outline"
                size="xs"
                loading={isRetrying}
                onClick={() => onRetry(delivery.id)}
              >
                <RotateCcw size={12} className="mr-1" />
                Retry Delivery
              </ModernButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// -- Main Component --

interface WebhookDeliveryLogProps {
  endpointId: number;
  onBack?: () => void;
}

const WebhookDeliveryLog: React.FC<WebhookDeliveryLogProps> = ({
  endpointId,
  onBack,
}) => {
  const {
    data: deliveriesRaw,
    isLoading,
    refetch,
  } = useFetchWebhookDeliveries(endpointId);
  const retryMutation = useRetryWebhookDelivery();

  const deliveries = Array.isArray(deliveriesRaw)
    ? (deliveriesRaw as WebhookDelivery[])
    : ((deliveriesRaw as Record<string, unknown>)?.data as WebhookDelivery[]) ?? [];

  const handleRetry = async (deliveryId: number) => {
    try {
      await retryMutation.mutateAsync({ endpointId, deliveryId });
      refetch();
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
          Loading delivery log...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <ModernButton variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft size={14} />
            </ModernButton>
          )}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Delivery Log
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({deliveries.length} deliveries)
          </span>
        </div>
        <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} />
        </ModernButton>
      </div>

      {/* Empty State */}
      {deliveries.length === 0 && (
        <ModernCard className="py-10 text-center">
          <Clock size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No deliveries yet.</p>
        </ModernCard>
      )}

      {/* Delivery List */}
      {deliveries.length > 0 && (
        <ModernCard className="overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {deliveries.map((delivery) => (
            <DeliveryRow
              key={delivery.id}
              delivery={delivery}
              onRetry={handleRetry}
              isRetrying={retryMutation.isPending}
            />
          ))}
        </ModernCard>
      )}
    </div>
  );
};

export default WebhookDeliveryLog;
