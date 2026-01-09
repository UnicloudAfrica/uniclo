import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientPageShell from "../components/ClientPageShell";
import TemplateGallery from "../../components/templates/TemplateGallery";
import { Wrench } from "lucide-react";

const ClientInstanceCreate: React.FC = () => {
  const navigate = useNavigate();

  const handleQuickDeploy = (template: any) => {
    // Navigate to provisioning wizard with template pre-fill
    navigate("/client-dashboard/instances/provision", {
      state: { template },
    });
  };

  const handleCustomize = (template: any) => {
    // Navigate to provisioning wizard with template for customization
    navigate("/client-dashboard/instances/provision", {
      state: { template, customize: true },
    });
  };

  return (
    <ClientPageShell
      title="Create Instances"
      description="Select from templates or build a custom instance"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Template Gallery */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Instance Templates</h2>
          <p className="text-slate-600 mb-6">
            Choose from our pre-configured templates for quick deployment
          </p>
          <TemplateGallery onSelectTemplate={handleQuickDeploy} onCustomize={handleCustomize} />
        </div>

        {/* Custom Build Option */}
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-start gap-4">
            <Wrench className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Need a custom configuration?
              </h3>
              <p className="text-slate-600 mb-4">
                Build your instance from scratch with full control over all settings
              </p>
              <button
                onClick={() => navigate("/client-dashboard/instances/provision")}
                className="px-4 py-2 bg-white border border-slate-300 hover:border-primary-500 hover:text-primary-600 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Build Custom Instance
              </button>
            </div>
          </div>
        </div>
      </div>
    </ClientPageShell>
  );
};

export default ClientInstanceCreate;
