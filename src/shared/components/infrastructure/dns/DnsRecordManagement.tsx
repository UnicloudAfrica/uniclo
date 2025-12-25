import React, { useState } from "react";
import { Plus, Search, Trash2, Edit2, ShieldAlert } from "lucide-react";
import ModernCard from "../../ui/ModernCard";

export interface DnsRecord {
  name: string;
  type: string;
  ttl?: number;
  resource_records?: { value: string }[];
  alias_target?: {
    hosted_zone_id: string;
    dns_name: string;
    evaluate_target_health: boolean;
  };
}

interface DnsRecordManagementProps {
  records: DnsRecord[];
  isLoading?: boolean;
  onAddRecord: (record: DnsRecord) => void;
  onDeleteRecord: (record: DnsRecord) => void;
}

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "NS", "SOA", "CAA"];

const DnsRecordManagement: React.FC<DnsRecordManagementProps> = ({
  records,
  isLoading = false,
  onAddRecord,
  onDeleteRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<DnsRecord>>({
    type: "A",
    ttl: 300,
    resource_records: [{ value: "" }],
  });

  const filteredRecords = records.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddValue = () => {
    setNewRecord({
      ...newRecord,
      resource_records: [...(newRecord.resource_records || []), { value: "" }],
    });
  };

  const handleValueChange = (index: number, val: string) => {
    const updated = [...(newRecord.resource_records || [])];
    updated[index] = { value: val };
    setNewRecord({ ...newRecord, resource_records: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecord.name && newRecord.type && newRecord.resource_records?.[0]?.value) {
      onAddRecord(newRecord as DnsRecord);
      setIsAdding(false);
      setNewRecord({ type: "A", ttl: 300, resource_records: [{ value: "" }] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search records..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Record</span>
        </button>
      </div>

      {isAdding && (
        <ModernCard variant="outlined" padding="lg" className="border-primary-100 bg-primary-50/10">
          <h4 className="text-md font-semibold text-gray-900 mb-4">New DNS Record</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Record Name</label>
                <input
                  type="text"
                  placeholder="e.g. www.example.com."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newRecord.name || ""}
                  onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Type</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                >
                  {RECORD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">
                  TTL (Seconds)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newRecord.ttl || 300}
                  onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">Values</label>
              {newRecord.resource_records?.map((rec, idx) => (
                <div key={idx} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Value"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={rec.value}
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                    required
                  />
                  {idx === (newRecord.resource_records?.length || 0) - 1 && (
                    <button
                      type="button"
                      onClick={handleAddValue}
                      className="p-2 text-gray-400 hover:text-primary-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors shadow-sm"
              >
                Save Record
              </button>
            </div>
          </form>
        </ModernCard>
      )}

      <ModernCard padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Name
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase w-20">
                Type
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Value
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase w-20">
                TTL
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  No records found matching your search.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, idx) => (
                <tr key={`${record.name}-${record.type}-${idx}`} className="hover:bg-gray-50/50">
                  <td
                    className="py-3 px-4 font-medium text-gray-900 truncate max-w-[200px]"
                    title={record.name}
                  >
                    {record.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {record.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs max-w-[300px] overflow-hidden">
                    {record.resource_records?.map((rr) => rr.value).join(", ") ||
                      record.alias_target?.dns_name ||
                      "-"}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{record.ttl || "-"}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${record.type} record for ${record.name}?`)) {
                          onDeleteRecord(record);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ModernCard>
    </div>
  );
};

export default DnsRecordManagement;
