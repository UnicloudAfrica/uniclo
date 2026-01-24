// @ts-nocheck
import React, { useState, useEffect } from "react";
import ModernModal from "../../ui/ModernModal";
import ModernInput from "../../ui/ModernInput";
import ModernSelect from "../../ui/ModernSelect";
import { ModernButton } from "../ui";

interface AddRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  internetGateways: any[];
  natGateways: any[];
  isLoading?: boolean;
}

const AddRouteModal: React.FC<AddRouteModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  internetGateways = [],
  natGateways = [],
  isLoading = false,
}) => {
  const [destinationCidr, setDestinationCidr] = useState("0.0.0.0/0");
  const [selectedGatewayId, setSelectedGatewayId] = useState("");
  const [selectedNatId, setSelectedNatId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setDestinationCidr("0.0.0.0/0");
      setSelectedGatewayId("");
      setSelectedNatId("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onAdd({
      destination_cidr_block: destinationCidr,
      gateway_id: selectedGatewayId || undefined,
      nat_gateway_id: selectedNatId || undefined,
    });
  };

  const getGatewayOptions = () => {
    return [
      { value: "", label: "None / Local" },
      ...internetGateways.map((igw) => ({
        value: igw.id,
        label: `${igw.name || igw.id} (IGW)`,
      })),
    ];
  };

  const getNatOptions = () => {
    return [
      { value: "", label: "None" },
      ...natGateways.map((nat) => ({
        value: nat.id,
        label: `${nat.name || nat.id} (NAT)`,
      })),
    ];
  };

  const handleGatewayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedGatewayId(val);
    if (val) setSelectedNatId(""); // Exclusive
  };

  const handleNatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedNatId(val);
    if (val) setSelectedGatewayId(""); // Exclusive
  };

  const actions = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: onClose,
    },
    {
      label: isLoading ? "Adding..." : "Add Route",
      variant: "primary",
      onClick: handleSubmit,
      disabled: isLoading || (!selectedGatewayId && !selectedNatId), // Require at least one target? Or allow local? Usually need target.
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Route"
      subtitle="Define where network traffic from your subnet should be directed."
      actions={actions}
      size="md"
    >
      <div className="space-y-4">
        <ModernInput
          label="Destination CIDR"
          placeholder="0.0.0.0/0"
          value={destinationCidr}
          onChange={(e) => setDestinationCidr(e.target.value)}
          helper="The IP range for the traffic destination."
        />

        <ModernSelect
          label="Target Internet Gateway"
          placeholder="Select Internet Gateway"
          value={selectedGatewayId}
          onChange={handleGatewayChange}
          options={getGatewayOptions()}
          disabled={Boolean(selectedNatId)}
          helper={selectedNatId ? "NAT Gateway selected" : undefined}
        />

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">OR</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <ModernSelect
          label="Target NAT Gateway"
          placeholder="Select NAT Gateway"
          value={selectedNatId}
          onChange={handleNatChange}
          options={getNatOptions()}
          disabled={Boolean(selectedGatewayId)}
          helper={selectedGatewayId ? "Internet Gateway selected" : undefined}
        />
      </div>
    </ModernModal>
  );
};

export default AddRouteModal;
