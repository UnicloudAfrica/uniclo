import React, { useState, useRef, useEffect } from "react";
import { X, Loader2, Search, ChevronDown, Check } from "lucide-react";
import { useCreateProject } from "../../hooks/projectHooks";
import ToastUtils from "../../utils/toastUtil";
import { useFetchGeneralRegions } from "../../hooks/resource";
import { useFetchClients } from "../../hooks/clientHooks";

const CreateProjectModal = ({ isOpen, onClose }) => {
  const { mutate: createProject, isPending } = useCreateProject();
  const { isFetching: isRegionsFetching, data: regions } =
    useFetchGeneralRegions();
  const {
    data: clients,
    isFetching: isClientsFetching,
    refetch,
  } = useFetchClients();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    default_region: "",
    type: "vpc",
    user_ids: [],
  });
  const [errors, setErrors] = useState({});
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [clientLoading, setClientLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = "Project Name is required";
    }
    if (!formData.default_region)
      newErrors.default_region = "Default Region is required";
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
    if (validateForm()) {
      const payload = { ...formData, user_ids: formData.user_ids };
      createProject(payload, {
        onSuccess: () => {
          // ToastUtils.success("Project Created Successfully");
          onClose();
        },
        onError: (error) => {
          console.error("Error creating project:", error.message);
        },
      });
    }
  };

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Create New Project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
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
            <div>
              <label
                htmlFor="default_region"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Region<span className="text-red-500">*</span>
              </label>
              <select
                id="default_region"
                value={formData.default_region}
                onChange={(e) =>
                  updateFormData("default_region", e.target.value)
                }
                className={`w-full input-field ${
                  errors.default_region ? "border-red-500" : "border-gray-300"
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
              {errors.default_region && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.default_region}
                </p>
              )}
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clients (Optional - Select multiple)
              </label>
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
                    isDropdownOpen
                      ? "opacity-100 max-h-60"
                      : "opacity-0 max-h-0"
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
                <p className="text-xs text-gray-500 mt-1">
                  {formData.user_ids.length} client(s) selected
                </p>
              )}
              {errors.user_ids && (
                <p className="text-red-500 text-xs mt-1">{errors.user_ids}</p>
              )}
            </div>
            {errors.general && (
              <p className="text-red-500 text-xs mt-1">{errors.general}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Close
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
