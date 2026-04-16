import { useState } from "react";
import { Download, Loader2, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useAvailableImages, useSubmitImageRequest, useMyImageRequests } from "@/hooks/imageRequestHooks";
import { ModernButton } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";

interface ImageRequestPanelProps {
  region: string;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ImageRequestPanel = ({ region }: ImageRequestPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: available = [], isFetching: loadingAvailable } = useAvailableImages(region, {
    enabled: isExpanded && !!region,
  });
  const { data: myRequests = [], isFetching: loadingRequests } = useMyImageRequests({
    enabled: isExpanded,
  });
  const submitMutation = useSubmitImageRequest();

  const handleRequest = (distro: string, version: string, arch: string) => {
    submitMutation.mutate(
      { distro, version, arch, region },
      {
        onSuccess: () => {
          ToastUtils.success(
            "Your request has been submitted. The admin team will review it."
          );
        },
        onError: () => {
          ToastUtils.error("Failed to submit request. You may have reached the daily limit.");
        },
      }
    );
  };

  if (!region) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Don't see what you need?
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
          {/* Available for request */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">
              Request an Image
            </h4>
            <p className="mb-3 text-xs text-slate-400">
              These upstream images can be requested. Once approved by our team, they'll be available in your region.
            </p>

            {loadingAvailable ? (
              <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading available images...
              </div>
            ) : available.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                All known upstream images are already available in this region.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Image</th>
                      <th className="px-4 py-2 text-center font-medium text-slate-500">Arch</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {available.map((img) => (
                      <tr
                        key={`${img.distro}-${img.version}`}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-slate-800">
                            {capitalize(img.distro)} {img.version}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-500">{img.arch}</td>
                        <td className="px-4 py-2.5 text-right">
                          {img.request_status ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {img.request_status === "pending"
                                ? "Requested"
                                : capitalize(img.request_status)}
                            </span>
                          ) : (
                            <ModernButton
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRequest(img.distro, img.version, img.arch)}
                              disabled={submitMutation.isPending}
                              className="text-xs"
                            >
                              <Download className="h-3 w-3" />
                              Request
                            </ModernButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* My requests */}
          {myRequests.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">My Requests</h4>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Image</th>
                      <th className="px-4 py-2 text-center font-medium text-slate-500">Region</th>
                      <th className="px-4 py-2 text-center font-medium text-slate-500">Status</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((req) => (
                      <tr
                        key={req.identifier}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          {capitalize(req.distro)} {req.version}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                            {req.region}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <RequestStatus status={req.status} />
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-slate-400">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RequestStatus = ({ status }: { status: string }) => {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    pending: {
      icon: <Clock className="h-3 w-3" />,
      label: "Pending",
      cls: "bg-amber-50 text-amber-600 border-amber-100",
    },
    importing: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: "Importing",
      cls: "bg-blue-50 text-blue-600 border-blue-100",
    },
    available: {
      icon: <CheckCircle className="h-3 w-3" />,
      label: "Available",
      cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    rejected: {
      icon: null,
      label: "Rejected",
      cls: "bg-red-50 text-red-600 border-red-100",
    },
  };

  const config = map[status] ?? map.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.cls}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export default ImageRequestPanel;
