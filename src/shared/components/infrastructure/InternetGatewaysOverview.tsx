// @ts-nocheck
import React, { useState } from "react";
import { Globe, Plus, Link, Link2Off, Trash2 } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import ModernButton from "../ui/ModernButton";
import { ResourceSection, ResourceEmptyState } from "../ui";
import { InternetGatewayPermissions } from "../../config/permissionPresets";

// Importing Modals
import CreateInternetGatewayModal from "./modals/CreateInternetGatewayModal";
import AttachInternetGatewayModal from "./modals/AttachInternetGatewayModal";

interface InternetGatewaysOverviewProps {
  gateways: any[];
  vpcs: any[]; // For attach modal
  isLoading: boolean;
  permissions: InternetGatewayPermissions;
  onCreate?: (name: string) => void;
  onDelete?: (igwId: string) => void;
  onAttach?: (igwId: string, vpcId: string) => void;
  onDetach?: (igwId: string, vpcId: string) => void;
  isCreating?: boolean;
  isAttaching?: boolean;
}

const InternetGatewaysOverview: React.FC<InternetGatewaysOverviewProps> = ({
  gateways = [],
  vpcs = [],
  isLoading,
  permissions,
  onCreate,
  onDelete,
  onAttach,
  onDetach,
  isCreating,
  isAttaching,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [attachModalState, setAttachModalState] = useState<{ open: boolean; igwId: string }>({
    open: false,
    igwId: "",
  });

  const handleCreateSubmit = (name: string) => {
    onCreate?.(name);
    setShowCreateModal(false);
  };

  const handleAttachSubmit = (vpcId: string) => {
    onAttach?.(attachModalState.igwId, vpcId);
    setAttachModalState({ open: false, igwId: "" });
  };

  const actions = permissions.canCreate
    ? [
        <ModernButton
          key="add"
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Gateway
        </ModernButton>,
      ]
    : [];

  const stats = [
    {
      label: "Total Gateways",
      value: gateways.length,
      tone: "primary",
      icon: <Globe size={16} />,
    },
    {
      label: "Attached",
      value: gateways.filter((g) => g.attachments && g.attachments.length > 0).length,
      tone: "success",
      icon: <Link size={16} />,
    },
  ];

  return (
    <>
      <ResourceSection
        title="Internet Gateways"
        description="Manage Internet Gateways for project connectivity."
        actions={actions}
        meta={stats}
        isLoading={isLoading}
      >
        {gateways.length === 0 ? (
          <ResourceEmptyState
            title="No Internet Gateways"
            message="Create an Internet Gateway to enable internet access for your VPCs."
            action={
              permissions.canCreate ? (
                <ModernButton variant="primary" onClick={() => setShowCreateModal(true)}>
                  Create Gateway
                </ModernButton>
              ) : undefined
            }
          />
        ) : (
          <ModernCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-600 uppercase">
                    Name
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-600 uppercase">
                    State
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-600 uppercase">
                    Attached VPC
                  </th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gateways.map((igw) => {
                  const attachment = igw.attachments?.[0];
                  return (
                    <tr key={igw.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{igw.name || "Unnamed"}</div>
                        <div className="text-xs text-gray-500 font-mono">{igw.id}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                            igw.state === "available"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {igw.state || "unknown"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-500">
                        {attachment ? (
                          <span className="flex items-center gap-2 text-blue-700 font-medium">
                            <Link className="w-3 h-3 text-green-600" />
                            {attachment.vpc_id} ({attachment.state})
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not attached</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {!attachment && permissions.canAttach && (
                          <button
                            onClick={() => setAttachModalState({ open: true, igwId: igw.id })}
                            className="text-purple-600 hover:text-purple-800 transition-colors p-1 hover:bg-purple-50 rounded"
                            title="Attach to VPC"
                          >
                            <Link className="w-4 h-4 inline" />
                          </button>
                        )}
                        {attachment && permissions.canDetach && (
                          <button
                            onClick={() => onDetach?.(igw.id, attachment.vpc_id)}
                            className="text-orange-600 hover:text-orange-800 transition-colors p-1 hover:bg-orange-50 rounded"
                            title="Detach from VPC"
                          >
                            <Link2Off className="w-4 h-4 inline" />
                          </button>
                        )}
                        {permissions.canDelete && (
                          <button
                            onClick={() => onDelete?.(igw.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                            title="Delete Gateway"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ModernCard>
        )}
      </ResourceSection>

      <CreateInternetGatewayModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSubmit}
        isLoading={isCreating}
      />

      <AttachInternetGatewayModal
        isOpen={attachModalState.open}
        onClose={() => setAttachModalState({ open: false, igwId: "" })}
        gatewayId={attachModalState.igwId}
        vpcs={vpcs}
        onAttach={handleAttachSubmit}
        isLoading={isAttaching}
      />
    </>
  );
};

export default InternetGatewaysOverview;
