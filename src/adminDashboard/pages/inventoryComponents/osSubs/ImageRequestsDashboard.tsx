import { useState } from "react";
import {
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
} from "lucide-react";
import {
  useImageRequests,
  useApproveImageRequest,
  useRejectImageRequest,
} from "@/hooks/adminHooks/imageDiscoveryHooks";
import { ModernButton } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";

const ImageRequestsDashboard = () => {
  const { data: requestsRaw = [], isFetching } = useImageRequests();
  const requests = requestsRaw as Array<Record<string, unknown>>;
  const approveMutation = useApproveImageRequest();
  const rejectMutation = useRejectImageRequest();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (identifier: string, distro: string, version: string) => {
    approveMutation.mutate(identifier, {
      onSuccess: () => {
        ToastUtils.success(`Import queued for ${distro} ${version}. Customers will be notified.`);
      },
    });
  };

  const handleReject = () => {
    if (!rejectId) return;
    rejectMutation.mutate(
      { identifier: rejectId, reason: rejectReason },
      {
        onSuccess: () => {
          ToastUtils.success("Request rejected.");
          setRejectId(null);
          setRejectReason("");
        },
      }
    );
  };

  if (isFetching && !requests.length) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 dark:text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading requests...
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
        <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          No image requests yet
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Customer requests will appear here when they need images not in the catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Customer Image Requests
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Sorted by demand. Approve recurring requests to cache the image from upstream.
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">
                Image
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">
                Region
              </th>
              <th className="px-4 py-2.5 text-center font-medium text-slate-500 dark:text-slate-400">
                Requests
              </th>
              <th className="px-4 py-2.5 text-center font-medium text-slate-500 dark:text-slate-400">
                Tenants
              </th>
              <th className="px-4 py-2.5 text-center font-medium text-slate-500 dark:text-slate-400">
                Status
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-500 dark:text-slate-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, idx) => (
              <tr
                key={`${req.distro}-${req.version}-${req.region}-${idx}`}
                className="border-b border-slate-50 last:border-0 dark:border-slate-800/50"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {capitalize(req.distro)} {req.version}
                  </span>
                  <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">
                    {req.arch}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {req.region}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
                  {req.total_requests}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Users className="h-3.5 w-3.5" />
                    {req.unique_tenants}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {req.status === "pending" && (
                    <div className="flex items-center justify-end gap-2">
                      <ModernButton
                        size="sm"
                        onClick={() => handleApprove(req.distro, req.distro, req.version)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Cache
                      </ModernButton>
                      <button
                        type="button"
                        onClick={() => setRejectId(`${req.distro}-${req.version}-${req.region}`)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700">
            <h3 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Reject Image Request
            </h3>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              rows={3}
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <ModernButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRejectId(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </ModernButton>
              <ModernButton
                size="sm"
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                Reject
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const StatusBadge = ({ status }: { status: string }) => {
  // Light + dark bg/text combos. Tailwind's `dark:` modifier composes
  // alongside the light variant in the same className string.
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: {
      bg: "bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-400/30",
      text: "text-amber-600 dark:text-amber-300",
      label: "Pending",
    },
    importing: {
      bg: "bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-400/30",
      text: "text-blue-600 dark:text-blue-300",
      label: "Importing",
    },
    available: {
      bg: "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-400/30",
      text: "text-emerald-600 dark:text-emerald-300",
      label: "Available",
    },
    rejected: {
      bg: "bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-400/30",
      text: "text-red-600 dark:text-red-300",
      label: "Rejected",
    },
  };

  const c = config[status] ?? config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      {status === "available" && <CheckCircle className="h-3 w-3" />}
      {c.label}
    </span>
  );
};

export default ImageRequestsDashboard;
