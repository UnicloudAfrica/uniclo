import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFetchProjects } from "../../hooks/adminHooks/projectHooks";
import {
  // useFetchBandwidths,
  // useFetchComputerInstances,
  // useFetchCrossConnect,
  // useFetchEbsVolumes,
  // useFetchFloatingIPs,
  // useFetchOsImages,
  useFetchProductPricing,
} from "../../hooks/resource";
import { useInitiateMultiInstanceRequest } from "../../hooks/adminHooks/instancesHook";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import StepProgress from "../../dashboard/components/instancesubcomps/stepProgress";
import ToastUtils from "../../utils/toastUtil";
import ConfigurationStep from "./instanceComp/configurationStep";
import ResourceAllocationStep from "./instanceComp/resourceAllocationStep";
import SummaryStep from "./instanceComp/summaryStep";
import PricingBreakdownStep from "./instanceComp/pricingBreakdownStep";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import { useFetchSubnets } from "../../hooks/adminHooks/subnetHooks";
import { useFetchSecurityGroups } from "../../hooks/adminHooks/securityGroupHooks";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchNetworkInterfaces } from "../../hooks/adminHooks/networkHooks";

const AdminAddInstance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const formContentRef = useRef(null);
  const preselectedProject = useMemo(
    () => location.state?.project,
    [location.state]
  );

  const [formData, setFormData] = useState({
    instance_name: "",
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
    number_of_instances: 1,
    subnet_id: "",
    security_group_ids: [],
    months: "",
    tags: [],
    fast_track: false,
    keypair_name: "",
    // Fields now part of Resource Allocation
    selectedProject: preselectedProject || null,
    assigned_to_type: "project",
    tenant_id: null,
    user_id: null,
  });

  const selectedRegion = formData.selectedProject?.region || "";

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchProductPricing(selectedRegion, "compute_instance", {
      // productable_type: "compute_instance"
      enabled: !!selectedRegion,
    });
  const { data: osImages, isFetching: isOsImagesFetching } =
    useFetchProductPricing(selectedRegion, "os_image", {
      // productable_type: "os_image"
      enabled: !!selectedRegion,
    });
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchProductPricing(selectedRegion, "bandwidth", {
      // productable_type: "bandwidth"
      enabled: !!selectedRegion,
    });
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchProductPricing(selectedRegion, "volume_type", {
      // productable_type: "volume_type"
      enabled: !!selectedRegion,
    });
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchProductPricing(selectedRegion, "cross_connect", {
      // productable_type: "cross_connect"
      enabled: !!selectedRegion,
    });
  const { data: floatingIps, isFetching: isFloatingIpsFetching } =
    useFetchProductPricing(selectedRegion, "ip", {
      // productable_type: "ip"
      enabled: !!selectedRegion,
    });

  const { data: projects, isFetching: isProjectsFetching } = useFetchProjects();
  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();
  const { data: regions, isFetching: isRegionsFetching } = useFetchRegions();
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [pricingRequests, setPricingRequests] = useState([]);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

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
  const { data: networkInterfaces, isFetching: isNetworkInterfacesFetching } =
    useFetchNetworkInterfaces(selectedProjectId, selectedRegion, {
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
    if (formData.selectedProject) {
      setSelectedProjectId(formData.selectedProject.identifier);
    } else {
      setSelectedProjectId("");
    }
  }, [formData.selectedProject]);

  const scrollFormToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStep = (step = currentStep, action = "next") => {
    const newErrors = {};
    if (step === 0) {
      if (formData.tags.length === 0)
        newErrors.tags = "At least one tag is required.";
    } else if (step === 1) {
      const isSubmittingStep = pricingRequests.length === 0;

      if (isSubmittingStep || action === "add") {
        if (!formData.instance_name.trim())
          newErrors.instance_name = "Instance Name is required.";
        if (!formData.selectedProject)
          newErrors.selectedProject = "A project must be selected.";
        if (!formData.storage_size_gb)
          newErrors.storage_size_gb = "Storage Size is required";
        else if (
          isNaN(formData.storage_size_gb) ||
          parseInt(formData.storage_size_gb, 10) < 1
        ) {
          newErrors.storage_size_gb =
            "Must be a positive integer of at least 1 GiB";
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
      field === "tenant_id" ||
      field === "user_id" ||
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
    const selectedOption = optionsList?.find((option) =>
      option.product
        ? String(option.product.id) === String(value)
        : String(option.id) === String(value)
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
        name: formData.instance_name,
        project_id: formData.selectedProject.id,
        region: formData.selectedProject.region,
        os_image_id: formData.selectedOsImage.product.productable_id,
        compute_instance_id:
          formData.selectedComputeInstance.product.productable_id,
        months: parseInt(formData.months),
        number_of_instances: parseInt(formData.number_of_instances),
        volume_types: [
          {
            volume_type_id: formData.selectedEbsVolume.product.productable_id,
            storage_size_gb: parseInt(formData.storage_size_gb),
          },
        ],
        keypair_name: formData.keypair_name,
        ...(formData.network_id && { network_id: formData.network_id }),
        ...(formData.subnet_id && { subnet_id: formData.subnet_id }),
        ...(formData.security_group_ids.length > 0 && {
          security_group_ids: formData.security_group_ids,
        }),
        ...(formData.bandwidth_id && {
          bandwidth_id: formData.bandwidth_id,
          bandwidth_count: parseInt(formData.bandwidth_count),
        }),
        ...(formData.floating_ip_id && {
          floating_ip_id: formData.floating_ip_id,
          floating_ip_count: parseInt(formData.floating_ip_count),
        }),
        _display: {
          compute: formData.selectedComputeInstance.product.productable_name,
          name: formData.instance_name,
          project: formData.selectedProject.name,
          os: formData.selectedOsImage.product.productable_name,
          storage: `${formData.storage_size_gb} GiB`,
        },
      };
      setPricingRequests([...pricingRequests, newRequest]);
      setFormData((prev) => ({
        ...prev,
        instance_name: "",
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
        selectedProject: preselectedProject || null,
        assigned_to_type: "project",
        tenant_id: null,
        user_id: null,
      }));
      setErrors((prev) => ({ ...prev, selectedProject: null }));
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
          setCurrentStep((prev) => prev + 1);
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
        addPricingRequest();
        ToastUtils.info("Configuration added. Click Next again to proceed.");
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      scrollFormToTop();
    } else {
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
      instance_name: "",
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
      selectedProject: preselectedProject || null,
      assigned_to_type: "project",
      tenant_id: null,
      user_id: null,
    });
    setPricingRequests([]);
    setErrors({});
    setGeneralError(null);
    setCurrentStep(0);
  };

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-instanceRequests"] });
    resetForm();
    if (preselectedProject) {
      const encodedId = encodeURIComponent(btoa(preselectedProject.identifier));
      navigate(
        `/admin-dashboard/projects/details?id=${encodedId}&name=${preselectedProject.name}`
      );
    } else {
      navigate("/admin-dashboard/instances");
    }
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
      <AdminHeadbar
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center pb-4 border-b">
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
          <div className="sticky top-0 z-10 bg-white pt-6 pb-4 border-b mb-6">
            <StepProgress currentStep={currentStep} steps={steps} />
          </div>
          <div
            ref={formContentRef}
            className="w-full flex flex-col items-center justify-start"
          >
            {renderStep()}
            {/* {generalError && (
              <div className="w-full max-w-3xl mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
                <p className="text-red-600 text-sm font-medium">
                  {generalError}
                </p>
              </div>
            )} */}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
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
              disabled={
                isSubmissionPending || (isAnyFetching && currentStep !== 0)
              }
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
      </main>
    </>
  );
};

export default AdminAddInstance;
