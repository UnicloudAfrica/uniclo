import React, { useEffect, useState } from "react";
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Database,
  Globe,
  Network,
  Shield,
  Key,
  Camera,
  Layers,
  RefreshCw,
} from "lucide-react";
import { useApiContext } from "@/hooks/useApiContext";

interface LimitEntry {
  used: number;
  limit: number;
  percentage: number;
}

interface LimitsData {
  instances: LimitEntry;
  vcpus: LimitEntry;
  memory_gb: LimitEntry;
  volumes: LimitEntry;
  block_storage_gb: LimitEntry;
  vpcs: LimitEntry;
  subnets: LimitEntry;
  security_groups: LimitEntry;
  public_ips: LimitEntry;
  key_pairs: LimitEntry;
  snapshots: LimitEntry;
  load_balancers: LimitEntry;
}

interface ProjectLimitsTabProps {
  projectId?: string;
  projectIdentifier?: string;
}

const resourceConfig: {
  key: keyof LimitsData;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  unit?: string;
  category: string;
}[] = [
  { key: "instances", label: "Instances", icon: Server, category: "Compute" },
  { key: "vcpus", label: "vCPUs", icon: Cpu, category: "Compute" },
  { key: "memory_gb", label: "Memory", icon: MemoryStick, unit: "GB", category: "Compute" },
  { key: "volumes", label: "Volumes", icon: HardDrive, category: "Storage" },
  {
    key: "block_storage_gb",
    label: "Block Storage",
    icon: Database,
    unit: "GB",
    category: "Storage",
  },
  { key: "snapshots", label: "Snapshots", icon: Camera, category: "Storage" },
  { key: "vpcs", label: "VPCs", icon: Network, category: "Networking" },
  { key: "subnets", label: "Subnets", icon: Layers, category: "Networking" },
  { key: "security_groups", label: "Security Groups", icon: Shield, category: "Networking" },
  { key: "public_ips", label: "Public IPs", icon: Globe, category: "Networking" },
  { key: "key_pairs", label: "Key Pairs", icon: Key, category: "Networking" },
  { key: "load_balancers", label: "Load Balancers", icon: Layers, category: "Networking" },
];

export default function ProjectLimitsTab({ projectIdentifier }: ProjectLimitsTabProps) {
  const { apiBaseUrl, authHeaders } = useApiContext();
  const [limits, setLimits] = useState<LimitsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = async () => {
    if (!projectIdentifier) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectIdentifier}/resource-limits`, {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setLimits(json.data?.limits ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdentifier, apiBaseUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-blue-500" size={24} />
        <span className="ml-2 text-gray-500">Loading resource limits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">Failed to load resource limits</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button
          onClick={fetchLimits}
          className="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Group by category
  const categories = ["Compute", "Storage", "Networking"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Resource Limits</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Current usage vs allocated quotas for this project
          </p>
        </div>
        <button
          onClick={fetchLimits}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {categories.map((category) => {
        const items = resourceConfig.filter((r) => r.category === category);
        return (
          <div
            key={category}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const data = limits?.[item.key];
                const used = data?.used ?? 0;
                const limit = data?.limit ?? 0;
                const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

                let barColor = "bg-blue-500";
                if (pct >= 90) barColor = "bg-red-500";
                else if (pct >= 70) barColor = "bg-orange-500";
                else if (pct >= 50) barColor = "bg-yellow-500";

                const Icon = item.icon;
                const displayUsed = item.unit ? `${used} ${item.unit}` : used;
                const displayLimit = item.unit ? `${limit} ${item.unit}` : limit;

                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 px-3 py-3 md:gap-4 md:px-5 md:py-4"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                        <span className="text-sm text-gray-500">
                          <span className="font-semibold text-gray-900">{displayUsed}</span> /{" "}
                          {displayLimit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right">
                      <span
                        className={`text-xs font-bold ${
                          pct >= 90
                            ? "text-red-600"
                            : pct >= 70
                              ? "text-orange-600"
                              : "text-gray-500"
                        }`}
                      >
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
