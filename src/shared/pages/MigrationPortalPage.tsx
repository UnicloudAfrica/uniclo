import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  Upload,
  Download,
  Plus,
  Trash2,
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Cloud,
  Server,
  HardDrive,
} from "lucide-react";
import { toastUtil } from "../../utils/toastUtil";

interface MigrationJob {
  id: string;
  identifier: string;
  type: "import" | "export";
  image_name: string;
  description?: string;
  source_cloud?: string;
  source_url?: string;
  target_region?: string;
  status: "pending" | "uploading" | "processing" | "completed" | "failed" | "cancelled";
  progress_percent: number;
  size_bytes: number;
  error_message?: string;
  project?: { name: string };
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

interface MigrationPortalPageProps {
  apiBaseUrl: string;
  getHeaders: () => Record<string, string>;
}

export const MigrationPortalPage: React.FC<MigrationPortalPageProps> = ({
  apiBaseUrl,
  getHeaders,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch migration jobs
  const {
    data: jobs = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["migration-jobs"],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/migrations`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch migration jobs");
      const json = await response.json();
      return json.data?.data || json.data || [];
    },
    refetchInterval: 5000, // Poll for progress updates
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`${apiBaseUrl}/migrations/${jobId}/cancel`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to cancel migration");
      return response.json();
    },
    onSuccess: () => {
      toastUtil.success("Migration cancelled");
      queryClient.invalidateQueries({ queryKey: ["migration-jobs"] });
    },
    onError: (error: Error) => {
      toastUtil.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`${apiBaseUrl}/migrations/${jobId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete migration");
      return response.json();
    },
    onSuccess: () => {
      toastUtil.success("Migration record deleted");
      queryClient.invalidateQueries({ queryKey: ["migration-jobs"] });
    },
    onError: (error: Error) => {
      toastUtil.error(error.message);
    },
  });

  const filteredJobs = jobs.filter((job: MigrationJob) => job.type === activeTab);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "processing":
      case "uploading":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "processing":
      case "uploading":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const getSourceCloudIcon = (cloud?: string) => {
    switch (cloud) {
      case "aws":
        return <Cloud className="w-4 h-4 text-orange-500" />;
      case "azure":
        return <Cloud className="w-4 h-4 text-blue-500" />;
      case "gcp":
        return <Cloud className="w-4 h-4 text-red-500" />;
      default:
        return <Server className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Migration Portal</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Import VMs from other clouds or export for migration
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("import")}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "import"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "export"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Import Card */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Import from Other Cloud
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AWS, Azure, GCP, or direct URL
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start Import
          </button>
        </div>

        {/* Export Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Export VM to Image</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create portable image from VM
              </p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Start Export
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {activeTab === "import" ? "Import" : "Export"} Jobs
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowRightLeft className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No {activeTab} jobs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredJobs.map((job: MigrationJob) => (
              <div key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {job.image_name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {job.source_cloud && (
                          <span className="flex items-center gap-1">
                            {getSourceCloudIcon(job.source_cloud)}
                            {job.source_cloud.toUpperCase()}
                          </span>
                        )}
                        {job.size_bytes > 0 && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3.5 h-3.5" />
                            {formatBytes(job.size_bytes)}
                          </span>
                        )}
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.status === "processing" || job.status === "uploading" ? (
                      <button
                        onClick={() => cancelMutation.mutate(job.identifier)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteMutation.mutate(job.identifier)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar for in-progress jobs */}
                {(job.status === "processing" || job.status === "uploading") && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Progress</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {job.progress_percent}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${job.progress_percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {job.error_message && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">{job.error_message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Modal placeholder */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Import VM Image</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Import wizard - select source cloud, enter URL, configure options
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationPortalPage;
