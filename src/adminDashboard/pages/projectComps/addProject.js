import React, { useState, useEffect } from "react";
import { X, Loader2, ExternalLink } from "lucide-react";
import { useCreateProject } from "../../../hooks/adminHooks/projectHooks";
import { useNavigate } from "react-router-dom";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchTenants } from "../../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../../hooks/adminHooks/clientHooks";
import { DropdownSelect } from "./dropdownSelect"; // Ensure this path is correct
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";

const CreateProjectModal = ({ isOpen, onClose }) => {
  const { mutate: createProject, isPending } = useCreateProject();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "vpc", // Default to vpc
    tenant_id: "",
    client_ids: [],
    default_region: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [createdProjectData, setCreatedProjectData] = useState(null);
  const [showSetupRedirect, setShowSetupRedirect] = useState(false);
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  // Provider derived server-side; no UI binding

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Project Name is required";
    }
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    if (!formData.default_region) {
      newErrors.default_region = "Default Region is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      setSubmitAttempts(prev => prev + 1);
      setProgressMessage('Preparing project data...');
      
      // Add timestamp to name on retry to avoid duplicates
      const baseName = formData.name;
      const projectName = submitAttempts > 0 
        ? `${baseName}_${Date.now()}`  // Add timestamp on retry
        : baseName;
      
      const payload = {
        name: projectName,
        description: formData.description,
        type: formData.type,
        tenant_id: formData.tenant_id || null,
        client_ids: formData.client_ids,
        default_region: formData.default_region,
        // provider omitted; derived server-side
      };

      console.log("Submitting Project Payload (Attempt ", submitAttempts + 1, "):", payload);
      
      // Show progress messages
      setTimeout(() => setProgressMessage('Creating project infrastructure...'), 5000);
      setTimeout(() => setProgressMessage('Configuring network resources...'), 15000);
      setTimeout(() => setProgressMessage('Finalizing project setup...'), 30000);

      createProject(payload, {
        onSuccess: (data) => {
          console.log('Project creation response:', data);
          setCreatedProjectData(data);
          
          if (data?.data?.status === 'provisioning' || data?.infrastructure_setup) {
            setProgressMessage('Project created successfully!');
            setShowSetupRedirect(true);
            setIsSubmitting(false);
            
            // If we have infrastructure setup info, show redirect option
            if (data?.infrastructure_setup?.url) {
              ToastUtils.success('Project created! You can now set up your infrastructure.');
            }
          } else {
            // Legacy mode - immediate success
            setProgressMessage('Project created successfully!');
            setTimeout(() => {
              handleSuccess();
            }, 1000);
          }
        },
        onError: (error) => {
          console.error(`Error creating project (Attempt ${submitAttempts + 1}):`, error.message);
          setIsSubmitting(false);
          setProgressMessage('');
          
          // Provide specific error handling
          if (error.message.includes('timeout')) {
            ToastUtils.error('The project creation is taking longer than expected. This might be due to heavy server load. Please try again or contact support if the issue persists.');
          } else if (error.message.includes('Network error')) {
            ToastUtils.error('Network connection issue. Please check your internet connection and try again.');
          } else {
            ToastUtils.error(`Failed to create project: ${error.message}`);
          }
        },
      });
    }
  };
  
  const handleRetry = () => {
    if (submitAttempts < 3) {
      handleSubmit();
    } else {
      ToastUtils.error('Maximum retry attempts reached. Please contact support if the issue persists.');
    }
  };
  
  const handleSuccess = () => {
    setIsSubmitting(false);
    setSubmitAttempts(0);
    setProgressMessage('');
    setCreatedProjectData(null);
    setShowSetupRedirect(false);
    onClose();
    setFormData({
      name: "",
      description: "",
      type: "vpc",
      tenant_id: "",
      client_ids: [],
      default_region: "",
      provider: "",
    });
  };
  
  const redirectToInfrastructureSetup = () => {
    const projectData = createdProjectData?.data;
    if (projectData?.identifier) {
      const encodedId = encodeURIComponent(btoa(projectData.identifier));
      
      // Navigate to dedicated infrastructure setup page for new projects
      navigate(`/admin-dashboard/infrastructure-setup?id=${encodedId}&new=1`);
      handleSuccess(); // Close modal
    }
  };
  
  const startStatusPolling = (projectIdentifier) => {
    let pollCount = 0;
    const maxPolls = 60; // 2 minutes with 2-second intervals
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const response = await fetch(`/admin/v1/projects/${projectIdentifier}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const statusData = await response.json();
        console.log('Project status:', statusData);
        
        // Update progress message
        if (statusData.progress?.message) {
          setProgressMessage(statusData.progress.message);
        }
        
        // Check for completion
        if (statusData.status === 'active') {
          clearInterval(pollInterval);
          setProgressMessage('Project provisioning completed successfully!');
          setTimeout(() => {
            handleSuccess();
          }, 1500);
          return;
        }
        
        if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          setIsSubmitting(false);
          setProgressMessage('');
          ToastUtils.error(`Project provisioning failed: ${statusData.error || 'Unknown error'}`);
          return;
        }
        
        // Timeout after max polls
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setIsSubmitting(false);
          setProgressMessage('');
          ToastUtils.warning('Project is still provisioning. Please check the projects page for updates.');
          handleSuccess(); // Close modal anyway
        }
        
      } catch (error) {
        console.error('Status polling error:', error);
        
        // On error, retry a few times then give up
        if (pollCount >= 5) {
          clearInterval(pollInterval);
          setIsSubmitting(false);
          setProgressMessage('');
          ToastUtils.warning('Unable to track provisioning status. Please check the projects page.');
          handleSuccess(); // Close modal anyway
        }
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
              <h2 className="text-lg font-semibold text-[#575758]">
                Create New Project
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
                disabled={isPending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
              <div className="space-y-4 w-full">
                {/* Project Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Project Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder="Enter project name"
                    className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Project Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Project Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData("description", e.target.value)
                    }
                    placeholder="Enter project description (optional)"
                    rows="3"
                    className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                  ></textarea>
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type<span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="projectType"
                        value="vpc"
                        checked={formData.type === "vpc"}
                        onChange={(e) => updateFormData("type", e.target.value)}
                        className="h-4 w-4 text-[#288DD1] border-gray-300 focus:ring-[#288DD1]"
                      />
                      <span className="ml-2 text-sm text-gray-700">VPC</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="projectType"
                        value="dvs"
                        checked={formData.type === "dvs"}
                        onChange={(e) => updateFormData("type", e.target.value)}
                        className="h-4 w-4 text-[#288DD1] border-gray-300 focus:ring-[#288DD1]"
                      />
                      <span className="ml-2 text-sm text-gray-700">DVS</span>
                    </label>
                  </div>
                  {errors.type && (
                    <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                  )}
                </div>

                {/* Default Region */}
                <div>
                  <label
                    htmlFor="default_region"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Default Region<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="default_region"
                    value={formData.default_region}
                    onChange={(e) =>
                      updateFormData("default_region", e.target.value)
                    }
                    className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                      errors.default_region
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={isRegionsFetching}
                  >
                    <option value="" disabled>
                      {isRegionsFetching
                        ? "Loading regions..."
                        : "Select a region"}
                    </option>
                    {regions?.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                  {errors.default_region && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.default_region}
                    </p>
                  )}
                  {formData.provider && (
                    <p className="text-sm text-gray-500 mt-1">
                      Provider: {formData.provider.toUpperCase()}
                    </p>
                  )}
                </div>

                {/* Partner (Tenant) Dropdown */}
                <div>
                  <label
                    htmlFor="tenant_id"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Partner (Optional)
                  </label>
                  <DropdownSelect
                    options={tenants || []}
                    value={formData.tenant_id}
                    onChange={(value) => updateFormData("tenant_id", value)}
                    placeholder="Select a Partner (optional)"
                    isFetching={isTenantsFetching}
                    displayKey="name"
                    valueKey="id"
                    searchKeys={["name"]}
                    error={errors.tenant_id}
                  />
                  {errors.tenant_id && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.tenant_id}
                    </p>
                  )}
                </div>

                {/* Client Dropdown */}
                <div>
                  <label
                    htmlFor="client_ids"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Client(s) (Optional)
                  </label>
                  <DropdownSelect
                    options={clients || []}
                    value={formData.client_ids}
                    onChange={(value) => updateFormData("client_ids", value)}
                    placeholder="Select Client(s)"
                    isFetching={isClientsFetching}
                    displayKey="first_name"
                    valueKey="id"
                    searchKeys={["first_name", "last_name", "email"]}
                    isMultiSelect={true}
                    error={errors.client_ids}
                  />
                  {errors.client_ids && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.client_ids}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  disabled={isPending}
                >
                  Close
                </button>
                {!isSubmitting ? (
                  <button
                    onClick={handleSubmit}
                    disabled={
                      isPending ||
                      isRegionsFetching ||
                      isTenantsFetching ||
                      isClientsFetching
                    }
                    className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submitAttempts > 0 && submitAttempts < 3 ? `Retry (${submitAttempts}/3)` : 'Create Project'}
                    {isPending && (
                      <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                    )}
                  </button>
                ) : showSetupRedirect ? (
                  // Show infrastructure setup options
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                      <span className="text-sm font-medium">
                        {progressMessage || 'Project created successfully!'}
                      </span>
                    </div>
                    <button
                      onClick={redirectToInfrastructureSetup}
                      className="flex items-center gap-2 px-4 py-2 bg-[#288DD1] text-white rounded-lg hover:bg-[#1976D2] transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Setup Infrastructure
                    </button>
                    <button
                      onClick={handleSuccess}
                      className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center px-6 py-3 bg-blue-50 text-blue-700 rounded-[30px]">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="text-sm font-medium">
                        {progressMessage || 'Creating project...'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Attempt {submitAttempts}/3
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateProjectModal;
