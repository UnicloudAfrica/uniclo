import React from "react";
import { Globe, Trash2, ArrowRight, Lock, Unlock } from "lucide-react";
import ModernCard from "../../ui/ModernCard";

export interface DnsZone {
  id: string;
  name: string;
  caller_reference: string;
  config?: {
    comment?: string;
    private_zone?: boolean;
  };
  resource_record_set_count?: number;
}

interface DnsZoneListProps {
  zones: DnsZone[];
  isLoading?: boolean;
  onSelectZone: (zone: DnsZone) => void;
  onDeleteZone: (zoneId: string) => void;
}

const DnsZoneList: React.FC<DnsZoneListProps> = ({
  zones,
  isLoading = false,
  onSelectZone,
  onDeleteZone,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-2 text-sm text-gray-500">Loading DNS zones...</p>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <ModernCard className="p-12 text-center border-dashed border-2">
        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No DNS Zones</h3>
        <p className="text-gray-500 max-w-xs mx-auto mt-1">
          Hosted zones allow you to manage DNS records for your domains.
        </p>
      </ModernCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {zones.map((zone) => (
        <ModernCard key={zone.id} hover className="group transition-all duration-200" padding="sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                <Globe className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4
                  className="font-semibold text-gray-900 truncate max-w-[150px]"
                  title={zone.name}
                >
                  {zone.name}
                </h4>
                <p className="text-xs text-gray-500 font-mono italic">{zone.id}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete the zone ${zone.name}?`)) {
                  onDeleteZone(zone.id);
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Type</span>
              <span className="flex items-center font-medium text-gray-700">
                {zone.config?.private_zone ? (
                  <>
                    <Lock className="w-3 h-3 mr-1" /> Private
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 mr-1" /> Public
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Records</span>
              <span className="font-medium text-gray-700">
                {zone.resource_record_set_count || 0}
              </span>
            </div>
            {zone.config?.comment && (
              <p className="text-xs text-gray-500 italic truncate border-t pt-2 mt-2">
                {zone.config.comment}
              </p>
            )}
          </div>

          <button
            onClick={() => onSelectZone(zone)}
            className="w-full flex items-center justify-center space-x-2 py-2 bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-700 text-sm font-medium rounded-lg transition-colors"
          >
            <span>Manage Records</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </ModernCard>
      ))}
    </div>
  );
};

export default DnsZoneList;
