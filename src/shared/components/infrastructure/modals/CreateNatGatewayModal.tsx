// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ModernModal from "../../ui/ModernModal";
import ModernInput from "../../ui/ModernInput";
import ModernSelect from "../../ui/ModernSelect";
import { useElasticIps, useSubnets } from "../../../hooks/vpcInfraHooks";

interface CreateNatGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  region: string;
  onCreate: (data: any) => void;
  isLoading?: boolean;
}

const CreateNatGatewayModal: React.FC<CreateNatGatewayModalProps> = ({
  isOpen,
  onClose,
  projectId,
  region,
  onCreate,
  isLoading = false,
}) => {
  const [gatewayName, setGatewayName] = useState("");
  const [selectedSubnet, setSelectedSubnet] = useState("");
  const [selectedEip, setSelectedEip] = useState("");

  const { data: subnets = [] } = useSubnets(projectId, region, { enabled: isOpen });
  const { data: elasticIps = [] } = useElasticIps(projectId, region, { enabled: isOpen });

  const isFormValid = selectedSubnet;

  useEffect(() => {
    if (!isOpen) {
      setGatewayName("");
      setSelectedSubnet("");
      setSelectedEip("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!isFormValid) return;

    const subnetRecord = subnets.find((subnet: any) => subnet.id === selectedSubnet);
    const vpcId = subnetRecord?.vpc_id || subnetRecord?.vpc_provider_id;

    onCreate({
      project_id: projectId,
      region,
      payload: {
        subnet_id: selectedSubnet,
        vpc_id: vpcId || undefined,
        elastic_ip_id: selectedEip || undefined,
        name: gatewayName || undefined,
      },
    });
  };

  const getSubnetOptions = () => {
    return subnets.map((subnet: any) => ({
      value: subnet.id,
      label: `${subnet.name || subnet.id} (${subnet.cidr || subnet.cidr_block})`,
    }));
  };

  const getEipOptions = () => {
    return [
      { value: "", label: "Allocate new Elastic IP" },
      ...elasticIps
        .filter((eip: any) => !eip.association_id)
        .map((eip: any) => ({
          value: eip.id,
          label: eip.public_ip || eip.id,
        })),
    ];
  };

  const actions = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: onClose,
    },
    {
      label: isLoading ? "Creating..." : "Create NAT Gateway",
      variant: "primary",
      onClick: handleSubmit,
      disabled: !isFormValid || isLoading,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create NAT Gateway"
      subtitle="Enable outbound internet access for private subnets."
      actions={actions}
      size="md"
    >
      <div className="space-y-4">
        <ModernInput
          label="Name (Optional)"
          placeholder="my-nat-gateway"
          value={gatewayName}
          onChange={(e) => setGatewayName(e.target.value)}
        />

        <ModernSelect
          label="Subnet"
          placeholder="Select a subnet"
          value={selectedSubnet}
          onChange={(e) => setSelectedSubnet(e.target.value)}
          options={getSubnetOptions()}
          required
        />

        <ModernSelect
          label="Elastic IP (Optional)"
          placeholder="Allocate new Elastic IP"
          value={selectedEip}
          onChange={(e) => setSelectedEip(e.target.value)}
          options={getEipOptions()}
          helper="Leave blank to allocate a new Elastic IP automatically."
        />
      </div>
    </ModernModal>
  );
};

export default CreateNatGatewayModal;
