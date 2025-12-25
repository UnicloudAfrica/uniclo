import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe2 } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../shared/components/ui/ModernCard";
import { useElasticIps } from "../../hooks/adminHooks/vpcInfraHooks";

interface ElasticIp {
  id: string;
  public_ip?: string;
  instance_id?: string;
  network_interface_id?: string;
  association_id?: string;
}

const ClientElasticIps: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: elasticIps = [], isLoading } = useElasticIps(projectId);

  const associatedCount = elasticIps.filter((eip: ElasticIp) => eip.association_id).length;

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-orange-600" />
          Elastic IPs
        </span>
      }
      description="Static public IP addresses for your instances"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{elasticIps.length}</div>
              <div className="text-sm text-gray-500">Total IPs</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{associatedCount}</div>
              <div className="text-sm text-gray-500">Associated</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {elasticIps.length - associatedCount}
              </div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>
        </ModernCard>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : elasticIps.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <Globe2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">No elastic IPs found</div>
        </ModernCard>
      ) : (
        <ModernCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Public IP
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Instance ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {elasticIps.map((eip: ElasticIp) => (
                <tr key={eip.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-mono font-medium text-gray-900">{eip.public_ip}</div>
                    <div className="text-xs text-gray-500">{eip.id}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">
                    {eip.instance_id || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        eip.association_id
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {eip.association_id ? "Associated" : "Available"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModernCard>
      )}
    </ClientPageShell>
  );
};

export default ClientElasticIps;
