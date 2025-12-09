// @ts-nocheck
import { X } from "lucide-react";

const ViewSubnetModal = ({ isOpen, onClose, subnet }: any) => {
  if (!isOpen || !subnet) return null;

  const meta = subnet.meta || {};
  const cidr = subnet.cidr_block || subnet.cidr || "—";
  const providerId = subnet.provider_resource_id || meta.id || "—";
  const vpcId = subnet.vpc_provider_id || subnet.vpc_id || meta.vpc_id || "—";
  const status = subnet.state || subnet.status || meta.state || "unknown";
  const availableIps = subnet.available_ip_address_count ?? meta.available_ip_address_count ?? "—";
  const totalIps = subnet.total_ip_address_count ?? meta.total_ip_address_count ?? "—";
  const mtu = meta.mtu ?? "—";
  const networkType = meta.network_type ?? "—";
  const gateway = subnet.gateway || meta.gateway_ip || meta.gateway || "—";
  const dns =
    Array.isArray(subnet.dns_servers) && subnet.dns_servers.length > 0
      ? subnet.dns_servers.join(", ")
      : Array.isArray(meta.dns_servers) && meta.dns_servers.length > 0
        ? meta.dns_servers.join(", ")
        : "—";
  const isDefault = subnet.is_default ?? meta.is_default ?? false;
  const createdAt = meta.created_at || "—";
  const updatedAt = meta.updated_at || "—";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[16px] w-full max-w-[560px] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Subnet Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3 text-sm text-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-gray-500">Name</div>
              <div className="text-gray-900">{subnet.name || providerId || cidr}</div>
            </div>
            <div>
              <div className="text-gray-500">ID</div>
              <div className="text-gray-900">{subnet.id}</div>
            </div>
            <div>
              <div className="text-gray-500">Provider Subnet ID</div>
              <div className="text-gray-900 break-all">{providerId}</div>
            </div>
            <div>
              <div className="text-gray-500">State</div>
              <div className="text-gray-900 capitalize">{status}</div>
            </div>
            <div>
              <div className="text-gray-500">Region</div>
              <div className="text-gray-900">{subnet.region}</div>
            </div>
            <div>
              <div className="text-gray-500">VPC ID</div>
              <div className="text-gray-900 break-all">{vpcId}</div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500">CIDR Block</div>
              <div className="text-gray-900 break-all">{cidr}</div>
            </div>
            <div>
              <div className="text-gray-500">Available IPs</div>
              <div className="text-gray-900">{availableIps}</div>
            </div>
            <div>
              <div className="text-gray-500">Total IPs</div>
              <div className="text-gray-900">{totalIps}</div>
            </div>
            <div>
              <div className="text-gray-500">Default Subnet</div>
              <div className="text-gray-900">{isDefault ? "Yes" : "No"}</div>
            </div>
            <div>
              <div className="text-gray-500">Network Type</div>
              <div className="text-gray-900 capitalize">{networkType}</div>
            </div>
            <div>
              <div className="text-gray-500">MTU</div>
              <div className="text-gray-900">{mtu}</div>
            </div>
            <div>
              <div className="text-gray-500">Gateway</div>
              <div className="text-gray-900 break-all">{gateway || "—"}</div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500">DNS Servers</div>
              <div className="text-gray-900">{dns}</div>
            </div>
            <div>
              <div className="text-gray-500">Created At</div>
              <div className="text-gray-900">{createdAt}</div>
            </div>
            <div>
              <div className="text-gray-500">Updated At</div>
              <div className="text-gray-900">{updatedAt}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSubnetModal;
