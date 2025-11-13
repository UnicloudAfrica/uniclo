import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreateClientProject } from "../../../hooks/clientHooks/projectHooks";
import { useFetchGeneralRegions } from "../../../hooks/resource";
import { useNavigate } from "react-router-dom";
import ToastUtils from "../../../utils/toastUtil";

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  region: "",
  type: "vpc",
};

const CreateProjectModal = ({ isOpen = false, onClose, mode = "modal" }) => {
  const isPageMode = mode === "page";
  const navigate = useNavigate();
  const { mutate: createProject, isPending } = useCreateClientProject();
  const { isFetching: isRegionsFetching, data: regions } =
    useFetchGeneralRegions();
  const [formData, setFormData] = useState({ ...INITIAL_FORM_STATE });
  const [errors, setErrors] = useState({});

  const resetState = () => {
    setFormData({ ...INITIAL_FORM_STATE });
    setErrors({});
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
    navigate(`/client-dashboard/projects/details?id=${encodedId}`);
  };

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

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    createProject(formData, {
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

  const sectionClasses =
    "rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm";

  const renderStructuredForm = () => (
    <div className="space-y-6">
      <div className={sectionClasses}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Project details
        </p>
        <h3 className="text-base font-semibold text-slate-900">
          Describe what this workspace is for
        </h3>
        <div className="mt-4 space-y-4">
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
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
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
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
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
        <h3 className="text-base font-semibold text-slate-900">
          Configure how workloads will deploy
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="region"
              className="block text-sm font-medium text-gray-700"
            >
              Region<span className="text-red-500">*</span>
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
              Type<span className="text-red-500">*</span>
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
    </div>
  );

  const renderSummaryPanel = () => {
    const summaryItems = [
      { label: "Project name", value: formData.name || "Not set" },
      {
        label: "Region",
        value: formData.region ? formData.region.toUpperCase() : "Select region",
      },
      {
        label: "Topology",
        value: formData.type ? formData.type.toUpperCase() : "Choose type",
      },
    ];

    const guidanceItems = [
      "Use a descriptive name so collaborators quickly understand the workspace.",
      "Pick the region closest to your workloads to minimize latency.",
      "Switch between VPC or DVS depending on the network isolation you need.",
    ];

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Live summary</h3>
          <dl className="mt-4 space-y-3 text-sm">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3"
              >
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white">
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

  if (!isPageMode && !isOpen) return null;

  if (isPageMode) {
    return (
      <div className="font-Outfit">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Client workspace setup
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Launch a project tailored to your workload requirements
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Define the region, topology, and context so collaborators know
              where to get started.
            </p>
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.8fr),minmax(250px,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              {renderStructuredForm()}
            </div>
            <aside>{renderSummaryPanel()}</aside>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={handleClose}
            className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full rounded-full bg-[#288DD1] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#1d75b4] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                Saving
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Create New Project
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          {renderStructuredForm()}
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
