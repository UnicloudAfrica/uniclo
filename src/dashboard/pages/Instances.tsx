import React from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import { ModernButton } from "../../shared/components/ui";

const Instances: React.FC = () => {
  const navigate = useNavigate();

  return (
    <TenantPageShell
      title="Instances"
      description="Manage and monitor your compute instances"
      actions={
        <ModernButton
          variant="primary"
          onClick={() => navigate("/dashboard/create-instance")}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Instance
        </ModernButton>
      }
    >
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Plus className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No instances yet</h3>
        <p className="text-gray-500 mb-6">Get started by creating your first instance</p>
        <ModernButton
          variant="primary"
          onClick={() => navigate("/dashboard/create-instance")}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Instance
        </ModernButton>
      </div>
    </TenantPageShell>
  );
};

export default Instances;
