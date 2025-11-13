import React, { useState, useRef, useEffect } from "react";
import { X, Loader2, Search, ChevronDown, Check } from "lucide-react";
import { useCreateProject } from "../../hooks/projectHooks";
import { useFetchGeneralRegions } from "../../hooks/resource";
import { useFetchClients } from "../../hooks/clientHooks";
import { useNavigate } from "react-router-dom";
import ToastUtils from "../../utils/toastUtil";

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  region: "",
  type: "vpc",
  user_ids: [],
};

const CreateProjectModal = ({ isOpen = false, onClose, mode = "modal" }) => {
  const isPageMode = mode === "page";
  const navigate = useNavigate();
  const { mutate: createProject, isPending } = useCreateProject();
  const { isFetching: isRegionsFetching, data: regions } =
    useFetchGeneralRegions();
  const {
    data: clients,
    isFetching: isClientsFetching,
    refetch,
  } = useFetchClients();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [clientLoading, setClientLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const resetState = () => {
    setFormData({ ...INITIAL_FORM_STATE });
    setErrors({});
    setSelectedClients([]);
    setClientSearch("");
    setClientPage(1);
    setClientLoading(false);
    setIsDropdownOpen(false);
  };

  const handleClose = () => {
    if (!isPageMode) {
      resetState();
    }
    onClose?.();
  };

  const resolveProjectIdentifier = (payload) => {
    if (!payload || typeof payload !== "object") {
      return null;
    }
    if (payload.identifier) return payload.identifier;
    if (payload.project_identifier) return payload.project_identifier;
    if (payload.projectId) return payload.projectId;
    if (payload.id) return payload.id;
    if (payload.project) return resolveProjectIdentifier(payload.project);
    if (payload.data) return resolveProjectIdentifier(payload.data);
    if (payload.message && typeof payload.message === "object") {
      return resolveProjectIdentifier(payload.message);
    }
    return null;
  };

  const redirectToProjectDetails = (projectPayload) => {
    const identifier = resolveProjectIdentifier(projectPayload);
    if (!identifier) {
      ToastUtils.warning(
        "Project created but could not resolve the identifier. Please check your projects list."
      );
      handleClose();
      return;
    }
    const encodedId = encodeURIComponent(btoa(String(identifier)));
    handleClose();
    navigate(`/dashboard/projects/details?id=${encodedId}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isPageMode && !isOpen) {
      resetState();
    }
  }, [isOpen, isPageMode]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = "Project Name is required";
    }
    if (!formData.region)
      newErrors.region = "Default Region is required";
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const toggleClientSelection = (clientId, clientName) => {
    const isSelected = formData.user_ids.includes(clientId);
    let updatedUserIds;
    if (isSelected) {
      updatedUserIds = formData.user_ids.filter((id) => id !== clientId);
    } else {
      updatedUserIds = [...formData.user_ids, clientId];
    }
    updateFormData("user_ids", updatedUserIds);

    if (isSelected) {
      setSelectedClients(selectedClients.filter((c) => c.id !== clientId));
    } else {
      setSelectedClients([
        ...selectedClients,
        { id: clientId, name: clientName },
      ]);
    }
  };

  const loadMoreClients = async () => {
    setClientLoading(true);
    setClientPage((prev) => prev + 1);
    await refetch();
    setClientLoading(false);
  };

  const handleClientSearch = (searchTerm) => {
    setClientSearch(searchTerm);
    setClientPage(1);
    refetch();
  };

  const clearClientSearch = () => {
    setClientSearch("");
    setClientPage(1);
    refetch();
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const payload = { ...formData, user_ids: formData.user_ids };
    createProject(payload, {
      onSuccess: (project) => {
        ToastUtils.success("Project created successfully!");
        redirectToProjectDetails(project);
      },
      onError: (error) => {
        console.error("Error creating project:", error?.message);
        ToastUtils.error(error?.message || "Failed to create project.");
      },
    });
  };

  if (!isPageMode && !isOpen) return null;

  const wrapperClasses = isPageMode
    ? "font-Outfit w-full"
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit";

  const cardClasses = isPageMode
    ? "bg-white rounded-[24px] border border-slate-200 shadow-sm w-full max-w-4xl mx-auto my-6"
    : "bg-white rounded-[24px] max-w-[650px] mx-4 w-full";

  const bodyClasses = isPageMode
    ? "px-6 py-6 w-full flex flex-col"
    : "px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start";

  const headerBackgroundClass = isPageMode ? "bg-white" : "bg-[#F2F2F2]";
  const showCloseButton = !isPageMode;
  const closeButtonLabel = isPageMode ? "Cancel" : "Close";

  const getFullName = (client) => {
    const parts = [
      client.first_name,
      client.middle_name,
      client.last_name,
    ].filter(Boolean);
    return parts.join(" ");
  };

  const filteredClients =
    clients?.filter(
      (client) =>
        getFullName(client)
          .toLowerCase()
          .includes(clientSearch.toLowerCase()) ||
        client.email.toLowerCase().includes(clientSearch.toLowerCase())
    ) || [];

  const hasMoreClients = filteredClients.length < (clients?.length || 0);

  const renderSummaryPanel = () => {
    const summaryItems = [
      { label: "Project name", value: formData.name || "Not set" },
      {
        label: "Region",
        value: formData.region
          ? formData.region.toUpperCase()
          : "Select a region",
      },
      {
        label: "Topology",
        value: formData.type ? formData.type.toUpperCase() : "Choose type",
      },
      {
        label: "Assigned clients",
        value: formData.user_ids.length
          ? `${formData.user_ids.length} selected`
          : "Optional",
      },
    ];

    const guidanceItems = [
      "Pick the default region tenants see when provisioning workloads.",
      "Projects can start as VPC or DVS—switch later from project settings.",
      "Assign multiple clients to grant them immediate workspace access.",
    ];

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Live summary</h3>
          <dl className="mt-4 space-y-3 text-sm">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4"
              >
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
          <p className="text-sm font-semibold">Launch checklist</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-100/80">
            {guidanceItems.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const sectionClasses =
    "rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm";

  const structuredForm = (
    <div className="space-y-6">
      <div className={sectionClasses}>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Project details
          </p>
          <h3 className="text-base font-semibold text-slate-900">
            Give the workspace a recognizable description
          </h3>
          <p className="text-sm text-slate-500">
            Share intent for teammates by filling in project name and summary.
          </p>
        </div>
        <div className="mt-5 space-y-4">
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
                className={`w-full input-field ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
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
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Enter project description (optional)"
                rows="3"
                className={`w-full input-field ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              ></textarea>
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                {errors.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className={sectionClasses}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Region & topology
        </p>
        <h3 className="text-base font-semibold text-slate-900 mt-1">
          Define where workloads launch
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="region"
              className="block text-sm font-medium text-gray-700"
            >
              Default region<span className="text-red-500">*</span>
            </label>
            <select
              id="region"
              value={formData.region}
              onChange={(e) => updateFormData("region", e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
                errors.region ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isRegionsFetching}
            >
              <option value="" disabled>
                {isRegionsFetching ? "Loading regions..." : "Select a region"}
              </option>
              {regions?.map((region) => (
                <option key={region.region} value={region.region}>
                  {region.label}
                </option>
              ))}
            </select>
            {errors.region && (
              <p className="text-red-500 text-xs mt-1">{errors.region}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Project type<span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["vpc", "dvs"].map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2 text-sm ${
                    formData.type === type
                      ? "border-[#288DD1] bg-[#288DD1]/5 text-[#0b4977]"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="projectType"
                    value={type}
                    checked={formData.type === type}
                    onChange={(e) => updateFormData("type", e.target.value)}
                    className="hidden"
                  />
                  <span className="font-semibold uppercase">{type}</span>
                  <span className="text-xs text-slate-500">
                    {type === "vpc"
                      ? "Standard network workspace"
                      : "Dedicated virtual segment"}
                  </span>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type}</p>
            )}
          </div>
        </div>
      </div>
      <div className={sectionClasses}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Workspace clients
        </p>
        <h3 className="text-base font-semibold text-slate-900 mt-1">
          Grant client access on day one
        </h3>
        <p className="text-sm text-slate-500">
          Select clients to attach to this project. They capture context during
          provisioning but are optional.
        </p>
        <div className="mt-4">
          <div className="relative w-full" ref={dropdownRef}>
            <div
              className={`flex items-center border ${
                isDropdownOpen ? "border-[#288DD1]" : "border-gray-300"
              } rounded-md input-field bg-white cursor-pointer`}
              onClick={toggleDropdown}
            >
              <Search className="ml-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={
                  selectedClients.length > 0
                    ? `${selectedClients.length} clients selected`
                    : "Search clients..."
                }
                value={clientSearch}
                onChange={(e) => handleClientSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm focus:outline-none bg-transparent"
                readOnly={!isDropdownOpen}
              />
              {clientSearch && isDropdownOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearClientSearch();
                  }}
                  className="absolute right-10 pr-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="mr-3 h-4 w-4 text-gray-400 flex items-center">
                {isDropdownOpen ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
            {selectedClients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedClients.map((client) => (
                  <span
                    key={client.id}
                    className="inline-flex items-center px-2 py-1 bg-[#288DD1] text-white text-xs rounded-full"
                  >
                    {client.name}
                    <button
                      type="button"
                      onClick={() =>
                        toggleClientSelection(client.id, client.name)
                      }
                      className="ml-1 text-white hover:text-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div
              className={`absolute z-10 w-full mt-1 bg-white border ${
                isDropdownOpen ? "border-[#288DD1]" : "border-gray-300"
              } rounded-md shadow-lg max-h-60 overflow-auto transition-all duration-200 ${
                isDropdownOpen ? "opacity-100 max-h-60" : "opacity-0 max-h-0"
              }`}
            >
              {(isDropdownOpen || selectedClients.length === 0) && (
                <div className="py-2">
                  {isClientsFetching ? (
                    <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading clients...
                    </div>
                  ) : clients && clients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No clients yet
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No clients found
                    </div>
                  ) : (
                    <>
                      {filteredClients.map((client) => (
                        <label
                          key={client.id}
                          className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.user_ids.includes(client.id)}
                            onChange={() =>
                              toggleClientSelection(
                                client.id,
                                getFullName(client)
                              )
                            }
                            className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1] mr-2"
                          />
                          <span className="text-sm">
                            {getFullName(client)} ({client.email})
                          </span>
                        </label>
                      ))}
                      {hasMoreClients && (
                        <button
                          onClick={loadMoreClients}
                          disabled={clientLoading}
                          className="w-full py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {clientLoading ? (
                            <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                          ) : (
                            "Load More"
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          {formData.user_ids.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {formData.user_ids.length} client(s) selected
            </p>
          )}
          {errors.user_ids && (
            <p className="text-red-500 text-xs mt-1">{errors.user_ids}</p>
          )}
        </div>
      </div>
      {errors.general && (
        <p className="text-red-500 text-xs mt-1">{errors.general}</p>
      )}
    </div>
  );


  if (isPageMode) {
    return (
      <div className="font-Outfit">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Project configuration
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Define your new workspace blueprint
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Capture the essential context your team needs to start deploying
              workloads right away.
            </p>
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.8fr),minmax(260px,1fr)]">
            <div className="space-y-6">{structuredForm}</div>
            <aside className="space-y-4">{renderSummaryPanel()}</aside>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={handleClose}
            className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto"
          >
            {closeButtonLabel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full rounded-full bg-[#288DD1] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#1d75b4] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                Creating
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            ) : (
              "Create Project"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <div className={cardClasses}>
        <div
          className={`flex justify-between items-center px-6 py-4 border-b rounded-t-[24px] w-full ${headerBackgroundClass}`}
        >
          <h2 className="text-lg font-semibold text-[#575758]">
            Create New Project
          </h2>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className={bodyClasses}>
          {structuredForm}
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              {closeButtonLabel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create Project
              {isPending && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
