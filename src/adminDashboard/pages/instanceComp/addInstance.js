import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useFetchProjects } from "../../../hooks/adminHooks/projectHooks";
import {
  useFetchBandwidths,
  useFetchComputerInstances,
  useFetchCrossConnect,
  useFetchEbsVolumes,
  useFetchFloatingIPs,
  useFetchOsImages,
} from "../../../hooks/resource";
import {
  useCreateInstanceRequest,
  useInitiateMultiInstanceRequest,
} from "../../../hooks/adminHooks/instancesHook";
import { useFetchTenants } from "../../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../../hooks/adminHooks/clientHooks";
import StepProgress from "../../../dashboard/components/instancesubcomps/stepProgress";
import ToastUtils from "../../../utils/toastUtil";
import ConfigurationStep from "./configurationStep";
import ResourceAllocationStep from "./resourceAllocationStep";
import SummaryStep from "./summaryStep";

import PricingBreakdownStep from "./pricingBreakdownStep";
import { useFetchKeyPairs } from "../../../hooks/adminHooks/keyPairHooks";
import { useFetchSubnets } from "../../../hooks/adminHooks/subnetHooks";
import { useFetchSecurityGroups } from "../../../hooks/adminHooks/securityGroupHooks";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import { useQueryClient } from "@tanstack/react-query";

const AddAdminInstance = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const formContentRef = useRef(null);
  const [formData, setFormData] = useState({
    number_of_instances: 1,
    storage_size_gb: "",
    selectedComputeInstance: null,
    selectedEbsVolume: null,
    selectedOsImage: null,
    bandwidth_id: null,
    bandwidth_count: 0,
    floating_ip_id: null,
    floating_ip_count: 0,
    cross_connect_id: null,
    cross_connect_count: 0,
    network_id: "", // Dummy for now
    subnet_id: "",
    security_group_ids: [],
    months: "",
    tags: [],
    fast_track: false,
    keypair_name: "",
    // Step 1 fields
    topLevel_assigned_to_type: "project",
    topLevel_tenant_id: null,
    topLevel_user_id: null,
  });

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances();
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages();
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchBandwidths();
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchCrossConnect();
  const { data: floatingIps, isFetching: isFloatingIpsFetching } =
    useFetchFloatingIPs();
  const { data: projects, isFetching: isProjectsFetching } = useFetchProjects();
  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();
  const { data: regions, isFetching: isRegionsFetching } = useFetchRegions();
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [pricingRequests, setPricingRequests] = useState([]);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  const selectedRegion =
    formData.topLevel_selectedProject?.default_region || "";
  const { data: keyPairs, isFetching: isKeyPairsFetching } = useFetchKeyPairs(
    selectedProjectId,
    selectedRegion,
    {
      enabled: !!selectedProjectId && !!selectedRegion,
    }
  );
  const { data: subnets, isFetching: isSubnetsFetching } = useFetchSubnets(
    selectedProjectId,
    selectedRegion,
    {
      enabled: !!selectedProjectId && !!selectedRegion,
    }
  );
  const { data: securityGroups, isFetching: isSecurityGroupsFetching } =
    useFetchSecurityGroups(selectedProjectId, selectedRegion, {
      enabled: !!selectedProjectId && !!selectedRegion,
    });

  const {
    mutate: initiateMultiInstanceRequest,
    isPending: isSubmissionPending,
  } = useInitiateMultiInstanceRequest();

  const availableTags = [
    "Web Server",
    "Database",
    "Development",
    "Production",
    "Analytics",
    "Testing",
    "Backend",
    "Frontend",
    "Monitoring",
    "Security",
    "CI/CD",
    "Data Processing",
    "Others",
  ];
  const steps = [
    "Configuration",
    "Resource Allocation",
    "Summary",
    "Confirmation",
  ];

  useEffect(() => {
    if (formData.topLevel_selectedProject) {
      setSelectedProjectId(formData.topLevel_selectedProject.identifier);
    } else {
      setSelectedProjectId("");
    }
  }, [formData.topLevel_selectedProject]);

  const scrollFormToTop = () => {
    if (formContentRef.current) {
      formContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validateStep = (step = currentStep, action = "next") => {
    const newErrors = {};
    if (step === 0) {
      if (formData.tags.length === 0)
        newErrors.tags = "At least one tag is required.";
    } else if (step === 1) {
      const isSubmittingStep = pricingRequests.length === 0;

      if (isSubmittingStep || action === "add") {
        if (!formData.topLevel_selectedProject)
          newErrors.topLevel_selectedProject =
            "A project must be selected in the previous step.";
        if (!formData.storage_size_gb)
          newErrors.storage_size_gb = "Storage Size is required";
        else if (
          isNaN(formData.storage_size_gb) ||
          parseInt(formData.storage_size_gb) < 30
        ) {
          newErrors.storage_size_gb = "Must be an integer of at least 30 GiB";
        }
        if (!formData.selectedComputeInstance)
          newErrors.selectedComputeInstance = "Compute Instance is required";
        if (!formData.selectedEbsVolume)
          newErrors.selectedEbsVolume = "EBS Volume is required";
        if (!formData.selectedOsImage)
          newErrors.selectedOsImage = "OS Image is required";
        if (!formData.keypair_name)
          newErrors.keypair_name = "Key Pair is required";
        if (!formData.months) newErrors.months = "Term (Months) is required";
        else if (isNaN(formData.months) || parseInt(formData.months) < 1)
          newErrors.months = "Term (Months) must be an integer and at least 1";
      }
    } else if (step === 2) {
      if (pricingRequests.length === 0) {
        newErrors.general = "There are no instance configurations to submit.";
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      ToastUtils.warning(
        "Please check the form for errors and make sure all required fields are filled."
      );
      return false;
    }
    return true;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => {
      let newValue = value;
      if (
        [
          "bandwidth_count",
          "number_of_instances",
          "storage_size_gb",
          "months",
          "floating_ip_count",
          "cross_connect_count",
        ].includes(field)
      ) {
        newValue = value ? parseInt(value) : 0;
      }
      const updatedState = { ...prev, [field]: newValue };
      if (field === "topLevel_assigned_to_type") {
        updatedState.topLevel_user_id = null;
        updatedState.topLevel_selectedProject = null;
        updatedState.topLevel_tenant_id = null;
      }

      return updatedState;
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
    setGeneralError(null);
  };

  const handleSelectChange = (field, value, optionsList) => {
    if (
      field === "bandwidth_id" ||
      field === "floating_ip_id" ||
      field === "cross_connect_id" ||
      field === "topLevel_tenant_id" ||
      field === "topLevel_user_id" ||
      field === "subnet_id" ||
      field === "network_id" ||
      field === "keypair_name"
    ) {
      updateFormData(field, value);
      return;
    }
    if (!value) {
      updateFormData(field, null);
      return;
    }
    const selectedOption = optionsList?.find(
      (option) => String(option.id) === String(value)
    );
    if (selectedOption) {
      updateFormData(field, selectedOption);
    } else {
      updateFormData(field, null);
    }
  };

  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => {
      if (field === "security_group_ids") {
        const currentValues = prev.security_group_ids || [];
        if (currentValues.includes(value)) {
          return {
            ...prev,
            security_group_ids: currentValues.filter((v) => v !== value),
          };
        }
        return { ...prev, security_group_ids: [...currentValues, value] };
      }

      const currentValues = prev[field];
      if (currentValues.includes(value)) {
        return { ...prev, [field]: currentValues.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...currentValues, value] };
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
    setGeneralError(null);
  };

  const addPricingRequest = () => {
    if (validateStep(1, "add")) {
      const newRequest = {
        project_id: formData.topLevel_selectedProject.id,
        region: formData.topLevel_selectedProject.default_region,
        os_image_id: formData.selectedOsImage.id,
        compute_instance_id: formData.selectedComputeInstance.id,
        months: parseInt(formData.months),
        number_of_instances: parseInt(formData.number_of_instances),
        volume_types: [
          {
            volume_type_id: formData.selectedEbsVolume.id,
            storage_size_gb: parseInt(formData.storage_size_gb),
          },
        ],
        keypair_name: formData.keypair_name, // Conditionally add networking fields
        ...(formData.network_id && { network_id: formData.network_id }),
        ...(formData.subnet_id && { subnet_id: formData.subnet_id }),
        ...(formData.security_group_ids.length > 0 && {
          security_group_ids: formData.security_group_ids,
        }), // Add optional fields if they exist
        ...(formData.bandwidth_id && {
          bandwidth_id: formData.bandwidth_id,
          bandwidth_count: parseInt(formData.bandwidth_count),
        }),
        ...(formData.floating_ip_id && {
          floating_ip_id: formData.floating_ip_id,
          floating_ip_count: parseInt(formData.floating_ip_count),
        }),
        // For display in the summary list
        _display: {
          compute: formData.selectedComputeInstance.name,
          project: formData.topLevel_selectedProject.name,
          os: formData.selectedOsImage.name,
          storage: `${formData.storage_size_gb} GiB`,
        },
      };
      setPricingRequests([...pricingRequests, newRequest]);
      setFormData((prev) => ({
        ...prev,
        number_of_instances: 1,
        storage_size_gb: "",
        selectedComputeInstance: null,
        selectedEbsVolume: null,
        selectedOsImage: null,
        network_id: "",
        subnet_id: "",
        security_group_ids: [],
        keypair_name: "",
        months: "",
      }));
      ToastUtils.success("Instance configuration added to the list.");
    }
  };

  const removePricingRequest = (index) => {
    setPricingRequests(pricingRequests.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (pricingRequests.length === 0) {
      ToastUtils.error(
        "Please add at least one instance configuration to the list before submitting."
      );
      return;
    }

    if (validateStep(2)) {
      const dataToSubmit = {
        pricing_requests: pricingRequests.map((req) => {
          const { _display, ...rest } = req;
          return rest;
        }),
        tags: formData.tags,
        fast_track: formData.fast_track,
      };

      initiateMultiInstanceRequest(dataToSubmit, {
        onSuccess: (res) => {
          setApiResponse(res.data);
          setCurrentStep((prev) => prev + 1); // Move to confirmation step
        },
        onError: (error) => {
          const errorMessage =
            error.response?.data?.message ||
            "Failed to initiate instance request.";
          setGeneralError(errorMessage);
        },
      });
    }
  };

  const handleNext = (e) => {
    if (!validateStep()) {
      return;
    }

    if (currentStep === 1) {
      if (pricingRequests.length === 0) {
        addPricingRequest(); // This already runs validation via `validateStep(1, 'add')`
        ToastUtils.info("Configuration added. Click Next again to proceed.");
        return; // Stop here to let the user review the added item.
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      scrollFormToTop();
    } else {
      // This case is now for the final "Finish" button on the Confirmation step
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollFormToTop();
      setErrors({});
      setGeneralError(null);
    }
  };

  const resetForm = () => {
    setFormData({
      number_of_instances: 1,
      storage_size_gb: "",
      selectedComputeInstance: null,
      selectedEbsVolume: null,
      selectedOsImage: null,
      bandwidth_id: null,
      bandwidth_count: 0,
      floating_ip_id: null,
      floating_ip_count: 0,
      cross_connect_id: null,
      cross_connect_count: 0,
      network_id: "",
      subnet_id: "",
      security_group_ids: [],
      months: "",
      tags: [],
      fast_track: false,
      keypair_name: "",
      topLevel_selectedProject: null,
      topLevel_assigned_to_type: "project",
      topLevel_tenant_id: null,
      topLevel_user_id: null,
    });
    setPricingRequests([]);
    setErrors({});
    setGeneralError(null);
    setCurrentStep(0);
  };

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-instanceRequests"] });
    onClose();
    resetForm();
  };

  const isAnyFetching =
    isComputerInstancesFetching ||
    isOsImagesFetching ||
    isBandwidthsFetching ||
    isEbsVolumesFetching ||
    isProjectsFetching ||
    isTenantsFetching ||
    isClientsFetching ||
    isRegionsFetching ||
    isCrossConnectsFetching ||
    isFloatingIpsFetching ||
    isKeyPairsFetching ||
    isSubnetsFetching ||
    isSecurityGroupsFetching;

  const renderStep = () => {
    if (isAnyFetching) {
      return (
        <div className="flex justify-center items-center h-full min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-600">Loading resources...</p>
        </div>
      );
    }
    switch (currentStep) {
      case 0:
        return (
          <ConfigurationStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            handleSelectChange={handleSelectChange}
            handleCheckboxChange={handleCheckboxChange}
            projects={projects}
            tenants={tenants}
            clients={clients}
            availableTags={availableTags}
          />
        );
      case 1:
        return (
          <ResourceAllocationStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            handleSelectChange={handleSelectChange}
            handleCheckboxChange={handleCheckboxChange}
            computerInstances={computerInstances}
            projects={projects}
            regions={regions}
            ebsVolumes={ebsVolumes}
            bandwidths={bandwidths}
            osImages={osImages}
            floatingIps={floatingIps}
            crossConnects={crossConnects}
            subnets={subnets}
            securityGroups={securityGroups}
            keyPairs={keyPairs}
            onAddRequest={addPricingRequest}
            pricingRequests={pricingRequests}
            onRemoveRequest={removePricingRequest}
          />
        );
      case 2:
        return (
          <SummaryStep formData={formData} pricingRequests={pricingRequests} />
        );
      case 3:
        return <PricingBreakdownStep apiResponse={apiResponse} />;
      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
              <h2 className="text-lg font-semibold text-[#575758]">
                Add New Instance
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
                disabled={isSubmissionPending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-3">
              <StepProgress currentStep={currentStep} steps={steps} />
            </div>
            <div
              ref={formContentRef}
              className="px-6 pb-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start"
            >
              {renderStep()}
              {generalError && (
                <p className="text-red-500 text-sm mt-4 text-center">
                  {generalError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                    disabled={isSubmissionPending}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1 inline-block" /> Back
                  </button>
                )}
              </div>
              <button
                onClick={
                  currentStep === 2
                    ? handleSubmit
                    : currentStep === 3
                    ? handleClose
                    : handleNext
                }
                disabled={isSubmissionPending || isAnyFetching}
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {currentStep === 3
                  ? "Finish"
                  : currentStep === 2
                  ? "Submit Request"
                  : "Next"}
                {isSubmissionPending && (
                  <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddAdminInstance;
