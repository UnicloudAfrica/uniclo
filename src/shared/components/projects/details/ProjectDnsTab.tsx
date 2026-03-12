import React, { useState, useMemo } from "react";
import {
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  ChevronRight,
  FileText,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  useDnsZones,
  useCreateDnsZone,
  useDeleteDnsZone,
  useDnsRecords,
  useChangeDnsRecords,
} from "../../../../hooks/dnsHooks";
import { ModernTable } from "@/shared/components/ui";

// ==================== Types ====================

interface ProjectDnsTabProps {
  projectId?: string;
  region?: string;
}

interface DnsZone {
  id: string;
  name: string;
  comment?: string;
  record_count?: number;
  resource_record_set_count?: number;
  created_at?: string;
}

interface DnsRecord {
  name: string;
  type: string;
  ttl?: number;
  value?: string;
  resource_records?: { value: string }[];
}

interface DnsRecordRow extends DnsRecord {
  id: string;
  displayValue: string;
}

// ==================== Constants ====================

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "SRV", "CAA", "PTR"] as const;

const typeColors: Record<string, string> = {
  A: "bg-blue-100 text-blue-700",
  AAAA: "bg-blue-100 text-blue-700",
  CNAME: "bg-purple-100 text-purple-700",
  MX: "bg-orange-100 text-orange-700",
  TXT: "bg-green-100 text-green-700",
  NS: "bg-gray-100 text-gray-600",
  SOA: "bg-gray-100 text-gray-600",
  SRV: "bg-yellow-100 text-yellow-700",
  CAA: "bg-red-100 text-red-700",
  PTR: "bg-teal-100 text-teal-700",
};

// ==================== Component ====================

export default function ProjectDnsTab({ projectId, region }: ProjectDnsTabProps) {
  const [selectedZone, setSelectedZone] = useState<DnsZone | null>(null);
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [deleteConfirmZoneId, setDeleteConfirmZoneId] = useState<string | null>(null);

  // Zone form state
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneComment, setNewZoneComment] = useState("");

  // Record form state
  const [newRecordName, setNewRecordName] = useState("");
  const [newRecordType, setNewRecordType] = useState<string>("A");
  const [newRecordValue, setNewRecordValue] = useState("");
  const [newRecordTTL, setNewRecordTTL] = useState("300");

  // Queries & Mutations
  const {
    data: zones = [],
    isLoading: zonesLoading,
    isError: zonesError,
    error: zonesErrorObj,
    refetch: refetchZones,
  } = useDnsZones(projectId, region);

  // Detect DNS-not-configured state
  const isDnsNotConfigured = zonesError && (zonesErrorObj as any)?.isDnsNotConfigured;

  const {
    data: records = [],
    isLoading: recordsLoading,
    refetch: refetchRecords,
  } = useDnsRecords(selectedZone?.id || "", projectId, region);

  const createZoneMutation = useCreateDnsZone();
  const deleteZoneMutation = useDeleteDnsZone();
  const changeRecordsMutation = useChangeDnsRecords();

  // Derived data
  const totalRecords = useMemo(() => {
    return (zones as DnsZone[]).reduce(
      (sum: number, z: DnsZone) => sum + (z.record_count ?? z.resource_record_set_count ?? 0),
      0
    );
  }, [zones]);

  const recordRows: DnsRecordRow[] = useMemo(() => {
    return (records as DnsRecord[]).map((r, idx) => ({
      ...r,
      id: `${r.name}-${r.type}-${idx}`,
      displayValue: r.value || r.resource_records?.map((rr) => rr.value).join(", ") || "-",
    }));
  }, [records]);

  // Handlers
  const handleCreateZone = () => {
    if (!newZoneName.trim()) return;
    createZoneMutation.mutate(
      {
        project_id: projectId,
        region,
        name: newZoneName.trim(),
        comment: newZoneComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNewZoneName("");
          setNewZoneComment("");
          setShowCreateZone(false);
        },
      }
    );
  };

  const handleDeleteZone = (zoneId: string) => {
    deleteZoneMutation.mutate(
      { zoneId, projectId, region },
      {
        onSuccess: () => {
          setDeleteConfirmZoneId(null);
          if (selectedZone?.id === zoneId) {
            setSelectedZone(null);
          }
        },
      }
    );
  };

  const handleAddRecord = () => {
    if (!selectedZone || !newRecordName.trim() || !newRecordValue.trim()) return;

    const changeBatch = {
      Changes: [
        {
          Action: "CREATE",
          ResourceRecordSet: {
            Name: newRecordName.trim(),
            Type: newRecordType,
            TTL: parseInt(newRecordTTL, 10) || 300,
            ResourceRecords: [{ Value: newRecordValue.trim() }],
          },
        },
      ],
    };

    changeRecordsMutation.mutate(
      { zoneId: selectedZone.id, projectId, region, changeBatch },
      {
        onSuccess: () => {
          setNewRecordName("");
          setNewRecordType("A");
          setNewRecordValue("");
          setNewRecordTTL("300");
          setShowAddRecord(false);
        },
      }
    );
  };

  const handleDeleteRecord = (record: DnsRecord) => {
    if (!selectedZone) return;

    const changeBatch = {
      Changes: [
        {
          Action: "DELETE",
          ResourceRecordSet: {
            Name: record.name,
            Type: record.type,
            TTL: record.ttl,
            ResourceRecords: record.resource_records || [{ Value: record.value || "" }],
          },
        },
      ],
    };

    changeRecordsMutation.mutate({ zoneId: selectedZone.id, projectId, region, changeBatch });
  };

  const handleRefresh = () => {
    refetchZones();
    if (selectedZone) {
      refetchRecords();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">DNS Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage hosted zones and DNS records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={zonesLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={zonesLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* DNS Not Configured State */}
      {isDnsNotConfigured ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
              <Info className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">DNS Not Available</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              DNS hosting is not configured for this project's region. This may require:
            </p>
            <ul className="text-sm text-gray-500 max-w-md mx-auto text-left inline-block mb-6 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                An edge network to be assigned to the project
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                DNS service to be enabled for the region
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                Proper cloud provider credentials configured
              </li>
            </ul>
            <p className="text-xs text-gray-400">
              Contact your platform administrator to enable DNS for this project.
            </p>
            <button
              onClick={() => refetchZones()}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      ) : zonesError ? (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load DNS</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              {(zonesErrorObj as Error)?.message ||
                "An unexpected error occurred while loading DNS zones."}
            </p>
            <button
              onClick={() => refetchZones()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <SummaryCard
              icon={Globe}
              label="Total Zones"
              value={(zones as DnsZone[]).length}
              color="blue"
            />
            <SummaryCard
              icon={FileText}
              label="Total Records"
              value={totalRecords}
              color="purple"
            />
          </div>

          {/* Two-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Zones List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Hosted Zones</h3>
                  <button
                    onClick={() => setShowCreateZone(!showCreateZone)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={12} />
                    Create Zone
                  </button>
                </div>

                {/* Create Zone Inline Form */}
                {showCreateZone && (
                  <div className="px-4 py-3 border-b border-gray-200 bg-blue-50/50 space-y-2">
                    <input
                      type="text"
                      placeholder="Domain name (e.g. example.com)"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Comment (optional)"
                      value={newZoneComment}
                      onChange={(e) => setNewZoneComment(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateZone}
                        disabled={!newZoneName.trim() || createZoneMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {createZoneMutation.isPending ? "Creating..." : "Create"}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateZone(false);
                          setNewZoneName("");
                          setNewZoneComment("");
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Zones List */}
                <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                  {zonesLoading ? (
                    <div className="px-4 py-12 text-center">
                      <RefreshCw className="mx-auto text-gray-300 mb-3 animate-spin" size={24} />
                      <p className="text-gray-400 text-sm">Loading zones...</p>
                    </div>
                  ) : (zones as DnsZone[]).length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <Globe className="mx-auto text-gray-300 mb-3" size={40} />
                      <p className="text-gray-500 font-medium">No hosted zones</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Create a zone to start managing DNS records
                      </p>
                    </div>
                  ) : (
                    (zones as DnsZone[]).map((zone) => (
                      <div key={zone.id} className="relative group">
                        <button
                          onClick={() => setSelectedZone(zone)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            selectedZone?.id === zone.id
                              ? "bg-blue-50 border-l-2 border-l-blue-600"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 text-sm truncate">
                                {zone.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">
                                  {zone.record_count ?? zone.resource_record_set_count ?? 0} records
                                </span>
                                {zone.created_at && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(zone.created_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {zone.comment && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate">
                                  {zone.comment}
                                </p>
                              )}
                            </div>
                            <ChevronRight
                              size={16}
                              className={`text-gray-400 flex-shrink-0 ${
                                selectedZone?.id === zone.id ? "text-blue-600" : ""
                              }`}
                            />
                          </div>
                        </button>
                        {/* Delete Zone Button */}
                        {deleteConfirmZoneId === zone.id ? (
                          <div className="absolute right-2 top-2 flex items-center gap-1 bg-white border border-red-200 rounded-lg shadow-sm px-2 py-1 z-10">
                            <span className="text-xs text-red-600 mr-1">Delete?</span>
                            <button
                              onClick={() => handleDeleteZone(zone.id)}
                              disabled={deleteZoneMutation.isPending}
                              className="px-2 py-0.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleteZoneMutation.isPending ? "..." : "Yes"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmZoneId(null)}
                              className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmZoneId(zone.id);
                            }}
                            className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete zone"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Records for Selected Zone */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {selectedZone ? (
                  <>
                    {/* Records Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700">
                          Records for <span className="text-blue-600">{selectedZone.name}</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowAddRecord(!showAddRecord)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        <Plus size={12} />
                        Add Record
                      </button>
                    </div>

                    {/* Add Record Inline Form */}
                    {showAddRecord && (
                      <div className="px-4 py-3 border-b border-gray-200 bg-blue-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          <input
                            type="text"
                            placeholder="Record name"
                            value={newRecordName}
                            onChange={(e) => setNewRecordName(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                          <select
                            value={newRecordType}
                            onChange={(e) => setNewRecordType(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                          >
                            {RECORD_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Value"
                            value={newRecordValue}
                            onChange={(e) => setNewRecordValue(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                          <input
                            type="number"
                            placeholder="TTL (seconds)"
                            value={newRecordTTL}
                            onChange={(e) => setNewRecordTTL(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleAddRecord}
                            disabled={
                              !newRecordName.trim() ||
                              !newRecordValue.trim() ||
                              changeRecordsMutation.isPending
                            }
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {changeRecordsMutation.isPending ? "Adding..." : "Add Record"}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddRecord(false);
                              setNewRecordName("");
                              setNewRecordType("A");
                              setNewRecordValue("");
                              setNewRecordTTL("300");
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Records Table */}
                    <ModernTable<DnsRecordRow>
                      data={recordRows}
                      loading={recordsLoading}
                      columns={[
                        {
                          key: "name",
                          header: "NAME",
                          sortable: true,
                          render: (value: unknown) => (
                            <span className="text-sm font-medium text-gray-900 font-mono">
                              {String(value)}
                            </span>
                          ),
                        },
                        {
                          key: "type",
                          header: "TYPE",
                          sortable: true,
                          render: (value: unknown) => {
                            const t = String(value);
                            return (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  typeColors[t] || "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {t}
                              </span>
                            );
                          },
                        },
                        {
                          key: "displayValue",
                          header: "VALUE",
                          sortable: false,
                          render: (value: unknown) => (
                            <span className="text-sm text-gray-700 font-mono break-all">
                              {String(value)}
                            </span>
                          ),
                        },
                        {
                          key: "ttl",
                          header: "TTL",
                          sortable: true,
                          render: (value: unknown) => (
                            <span className="text-sm text-gray-500">
                              {value != null ? `${value}s` : "-"}
                            </span>
                          ),
                        },
                        {
                          key: "id",
                          header: "ACTIONS",
                          sortable: false,
                          align: "right" as const,
                          render: (_value: unknown, row: DnsRecordRow) => (
                            <button
                              onClick={() => handleDeleteRecord(row)}
                              disabled={changeRecordsMutation.isPending}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-opacity disabled:opacity-50"
                              title="Delete record"
                            >
                              <Trash2 size={14} />
                            </button>
                          ),
                        },
                      ]}
                      searchable={true}
                      searchKeys={["name", "type", "displayValue"]}
                      paginated={recordRows.length > 10}
                      pageSize={10}
                      exportable={false}
                      filterable={false}
                      enableAnimations={false}
                      emptyMessage={
                        <div className="py-8 text-center">
                          <FileText className="mx-auto text-gray-300 mb-3" size={40} />
                          <p className="text-gray-500 font-medium">No records found</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Add a DNS record to this zone
                          </p>
                        </div>
                      }
                    />
                  </>
                ) : (
                  <div className="px-4 py-16 text-center">
                    <Globe className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 font-medium">Select a hosted zone</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Choose a zone from the left panel to view and manage its DNS records
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ==================== Sub-components ====================

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${bgColors[color] || "bg-gray-50"} flex items-center justify-center`}
        >
          <Icon size={20} className={iconColors[color] || "text-gray-600"} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
