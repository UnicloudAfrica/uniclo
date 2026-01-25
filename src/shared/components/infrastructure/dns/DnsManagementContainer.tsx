import React, { useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import {
  useDnsZones,
  useCreateDnsZone,
  useDeleteDnsZone,
  useDnsRecords,
  useChangeDnsRecords,
} from "../../../../hooks/dnsHooks";
import DnsZoneList, { DnsZone } from "./DnsZoneList";
import DnsRecordManagement, { DnsRecord } from "./DnsRecordManagement";
import ModernCard from "../../ui/ModernCard";

interface DnsManagementContainerProps {
  projectId?: string;
  region?: string;
}

const DnsManagementContainer: React.FC<DnsManagementContainerProps> = ({ projectId, region }) => {
  const [selectedZone, setSelectedZone] = useState<DnsZone | null>(null);
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneComment, setZoneComment] = useState("");

  // Queries & Mutations (projectId and region are now optional for tenant-level)
  const { data: zones = [], isLoading: isLoadingZones } = useDnsZones(projectId, region);
  const { mutate: createZone, isPending: isCreating } = useCreateDnsZone();
  const { mutate: deleteZone } = useDeleteDnsZone();

  const { data: records = [], isLoading: isLoadingRecords } = useDnsRecords(
    selectedZone?.id || "",
    projectId,
    region
  );
  const { mutate: changeRecords } = useChangeDnsRecords();

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    createZone(
      {
        project_id: projectId,
        region,
        name: zoneName.endsWith(".") ? zoneName : `${zoneName}.`,
        comment: zoneComment,
      },
      {
        onSuccess: () => {
          setIsCreatingZone(false);
          setZoneName("");
          setZoneComment("");
        },
      }
    );
  };

  const handleAddRecord = (record: DnsRecord) => {
    if (!selectedZone) return;

    changeRecords({
      zoneId: selectedZone.id,
      projectId,
      region,
      changeBatch: {
        comment: "Added record via portal UI",
        changes: [
          {
            action: "CREATE",
            resource_record_set: record,
          },
        ],
      },
    });
  };

  const handleDeleteRecord = (record: DnsRecord) => {
    if (!selectedZone) return;

    changeRecords({
      zoneId: selectedZone.id,
      projectId,
      region,
      changeBatch: {
        comment: "Deleted record via portal UI",
        changes: [
          {
            action: "DELETE",
            resource_record_set: record,
          },
        ],
      },
    });
  };

  if (selectedZone) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedZone(null)}
            className="flex items-center text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Zones
          </button>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">{selectedZone.name}</h2>
            <p className="text-xs text-gray-500 font-mono italic">{selectedZone.id}</p>
          </div>
        </div>

        <DnsRecordManagement
          records={records}
          isLoading={isLoadingRecords}
          onAddRecord={handleAddRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DNS Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage public and private hosted zones and their records.
          </p>
        </div>
        <button
          onClick={() => setIsCreatingZone(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Hosted Zone</span>
        </button>
      </div>

      {isCreatingZone && (
        <ModernCard variant="outlined" padding="lg" className="border-primary-100 bg-primary-50/10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Hosted Zone</h3>
          <form onSubmit={handleCreateZone} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Domain Name</label>
                <input
                  type="text"
                  placeholder="e.g. example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  The domain name for which you want to handle traffic.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Comment</label>
                <input
                  type="text"
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={zoneComment}
                  onChange={(e) => setZoneComment(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setIsCreatingZone(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Zone
              </button>
            </div>
          </form>
        </ModernCard>
      )}

      <DnsZoneList
        zones={zones}
        isLoading={isLoadingZones}
        onSelectZone={setSelectedZone}
        onDeleteZone={(zoneId) => deleteZone({ zoneId, projectId, region })}
      />
    </div>
  );
};

export default DnsManagementContainer;
