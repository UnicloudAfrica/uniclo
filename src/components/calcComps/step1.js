import React, { useState, useMemo } from "react";
import { CheckCircle, ChevronRight, Cpu, HardDrive, Cloud } from "lucide-react";

export const Step1Configuration = ({ handleNext }) => {
  // State to hold all form data for the single, combined form
  const [formData, setFormData] = useState({
    compute_flavor_id: null,
    os_image_id: null,
    runtime_days: 1,
    // Store volumes with their custom capacity instead of quantity
    volumes: {},
    floating_ip_count: 0,
    ip_bandwidth_id: null,
    ip_runtime_days: 1,
    cross_connect: false, // New optional field
  });

  // Mock data to simulate fetching from an API
  const mockData = {
    compute_flavors: [
      {
        id: "flavor-1",
        name: "Standard Compute",
        vcpus: 2,
        memory: "4 GB",
        price: 0.05,
      },
      {
        id: "flavor-2",
        name: "High-Memory Compute",
        vcpus: 4,
        memory: "16 GB",
        price: 0.15,
      },
      {
        id: "flavor-3",
        name: "GPU-Accelerated",
        vcpus: 8,
        memory: "32 GB",
        price: 0.5,
      },
    ],
    os_images: [
      {
        id: "os-1",
        name: "Ubuntu 22.04 LTS",
        logo: "https://placehold.co/40x40/000000/ffffff?text=U",
        price: 0.0,
      },
      {
        id: "os-2",
        name: "Windows Server 2022",
        logo: "https://placehold.co/40x40/0078D4/ffffff?text=W",
        price: 0.02,
      },
      {
        id: "os-3",
        name: "CentOS 8 Stream",
        logo: "https://placehold.co/40x40/FFC107/000000?text=C",
        price: 0.0,
      },
    ],
    // Updated EBS volumes data: capacity is no longer fixed, and we use a pricePerGB
    ebs_volumes: [
      { id: "volume-1", name: "Standard SSD", pricePerGB: 0.1 },
      {
        id: "volume-2",
        name: "High-Performance SSD",
        pricePerGB: 0.3,
      },
    ],
    ip_bandwidths: [
      {
        id: "bandwidth-1",
        name: "Standard Bandwidth",
        speed: "100 Mbps",
        price: 0.01,
      },
      {
        id: "bandwidth-2",
        name: "High-Speed Bandwidth",
        speed: "1 Gbps",
        price: 0.03,
      },
    ],
  };

  // Helper function to handle basic input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper function for table row selections
  const handleSelect = (field, item) => {
    setFormData((prev) => ({ ...prev, [field]: item.id }));
  };

  // New helper function to handle volume capacity changes
  const handleVolumeCapacityChange = (volumeId, value) => {
    const capacity = parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      volumes: {
        ...prev.volumes,
        [volumeId]: capacity > 0 ? capacity : 1,
      },
    }));
  };

  // Helper function to toggle a volume's selection status
  const toggleVolumeSelection = (volumeId) => {
    setFormData((prev) => {
      const newVolumes = { ...prev.volumes };
      if (newVolumes[volumeId]) {
        // If already selected, deselect it
        delete newVolumes[volumeId];
      } else {
        // If not selected, select it with a default capacity of 30 GB
        newVolumes[volumeId] = 30;
      }
      return { ...prev, volumes: newVolumes };
    });
  };

  // Validation logic: "Next" is only enabled if the core configuration is complete
  const isFormValid = useMemo(() => {
    return (
      formData.compute_flavor_id &&
      formData.os_image_id &&
      formData.runtime_days > 0
    );
  }, [formData]);

  // Main function to format and pass the data to the parent component
  const handleNextClick = () => {
    // Format volumes to an array of objects with id and capacity
    const volumesArray = Object.entries(formData.volumes).map(
      ([volumeId, capacity]) => ({
        ebs_volume_id: volumeId,
        capacity: capacity,
      })
    );

    const outputData = {
      compute_flavor_id: formData.compute_flavor_id,
      os_image_id: formData.os_image_id,
      runtime_days: formData.runtime_days,
      volumes: volumesArray,
      floating_ip_count: formData.floating_ip_count,
      ip_bandwidth_id: formData.ip_bandwidth_id,
      ip_runtime_days: formData.ip_runtime_days,
      cross_connect: formData.cross_connect,
    };

    handleNext(outputData);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 font-outfit">
      <div className="space-y-10">
        {/* Core Configuration Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-[#121212]">
            Core Configuration
          </h3>
          <p className="text-gray-600">
            Select a compute flavor and operating system.
          </p>

          <div>
            <label
              htmlFor="runtime_days"
              className="block text-lg font-medium text-[#121212] mb-2"
            >
              Runtime Days<span className="text-red-500">*</span>
            </label>
            <input
              id="runtime_days"
              type="number"
              value={formData.runtime_days}
              onChange={(e) =>
                handleInputChange("runtime_days", parseInt(e.target.value, 10))
              }
              min="1"
              className="w-full input-field border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-medium text-[#121212]">
              Compute Flavor<span className="text-red-500">*</span>
            </label>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      vCPUs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Memory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price/hr
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Select</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockData.compute_flavors.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors duration-200 ${
                        formData.compute_flavor_id === item.id
                          ? "bg-[#ECF6FE]"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelect("compute_flavor_id", item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.vcpus}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.memory}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${item.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formData.compute_flavor_id === item.id ? (
                          <CheckCircle className="text-[#288DD1] w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-medium text-[#121212]">
              Operating System<span className="text-red-500">*</span>
            </label>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price/hr
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Select</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockData.os_images.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors duration-200 ${
                        formData.os_image_id === item.id
                          ? "bg-[#ECF6FE]"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelect("os_image_id", item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <img
                            src={item.logo}
                            alt={item.name}
                            className="w-6 h-6 mr-3 rounded-full"
                          />
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${item.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formData.os_image_id === item.id ? (
                          <CheckCircle className="text-[#288DD1] w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Optional Block Storage Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-[#121212] flex items-center">
            <HardDrive className="mr-3 text-gray-500" />
            Optional: Add Block Storage
          </h3>
          <p className="text-gray-600">
            Select the type of EBS volumes and enter the capacity you need.
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price/GB/mo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity (GB)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockData.ebs_volumes.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors duration-200 ${
                      formData.volumes[item.id]
                        ? "bg-[#ECF6FE]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!formData.volumes[item.id]}
                        onChange={() => toggleVolumeSelection(item.id)}
                        className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${item.pricePerGB}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formData.volumes[item.id] && (
                        <input
                          type="number"
                          value={formData.volumes[item.id]}
                          onChange={(e) =>
                            handleVolumeCapacityChange(item.id, e.target.value)
                          }
                          min="1"
                          className="w-20 input-field border border-gray-300 rounded-lg p-2"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Optional Networking Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-[#121212] flex items-center">
            <Cloud className="mr-3 text-gray-500" />
            Optional: Configure Networking
          </h3>
          <p className="text-gray-600">
            Specify the number of public IPs and their bandwidth.
          </p>

          <div>
            <label
              htmlFor="floating_ip_count"
              className="block text-lg font-medium text-[#121212] mb-2"
            >
              Number of Public IPs
            </label>
            <input
              id="floating_ip_count"
              type="number"
              value={formData.floating_ip_count}
              onChange={(e) =>
                handleInputChange(
                  "floating_ip_count",
                  parseInt(e.target.value, 10)
                )
              }
              min="0"
              className="w-full input-field border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label
              htmlFor="ip_runtime_days"
              className="block text-lg font-medium text-[#121212] mb-2"
            >
              IP Runtime Days
            </label>
            <input
              id="ip_runtime_days"
              type="number"
              value={formData.ip_runtime_days}
              onChange={(e) =>
                handleInputChange(
                  "ip_runtime_days",
                  parseInt(e.target.value, 10)
                )
              }
              min="1"
              className="w-full input-field border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-medium text-[#121212]">
              IP Bandwidth
            </label>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Speed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price/GB
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Select</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockData.ip_bandwidths.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors duration-200 ${
                        formData.ip_bandwidth_id === item.id
                          ? "bg-[#ECF6FE]"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelect("ip_bandwidth_id", item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.speed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${item.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formData.ip_bandwidth_id === item.id ? (
                          <CheckCircle className="text-[#288DD1] w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="cross_connect"
              checked={formData.cross_connect}
              onChange={(e) =>
                handleInputChange("cross_connect", e.target.checked)
              }
              className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
            />
            <label
              htmlFor="cross_connect"
              className="text-lg font-medium text-[#121212]"
            >
              Include Cross Connect
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleNextClick}
          disabled={!isFormValid}
          className={`px-8 py-3 rounded-full text-white font-medium transition-colors duration-200 flex items-center justify-center ${
            isFormValid
              ? "bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8] hover:animate-pulse"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Review Configuration <ChevronRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
