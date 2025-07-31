import { CheckCircle, ChevronRight } from "lucide-react";

export const Step1Configuration = ({
  selectedOptions,
  handleSelect,
  handleNext,
}) => {
  const isFormValid =
    selectedOptions.instance &&
    selectedOptions.storage &&
    selectedOptions.bandwidth &&
    selectedOptions.osImage;

  const mockData = {
    instances: [
      {
        id: "instance-1",
        name: "Standard Compute",
        vcpus: 2,
        memory: "4 GB",
        price: 0.05,
      },
      {
        id: "instance-2",
        name: "High-Memory Compute",
        vcpus: 4,
        memory: "16 GB",
        price: 0.15,
      },
      {
        id: "instance-3",
        name: "GPU-Accelerated",
        vcpus: 8,
        memory: "32 GB",
        price: 0.5,
      },
      {
        id: "instance-4",
        name: "Standard Compute",
        vcpus: 2,
        memory: "4 GB",
        price: 0.05,
      },
      {
        id: "instance-5",
        name: "High-Memory Compute",
        vcpus: 4,
        memory: "16 GB",
        price: 0.15,
      },
      {
        id: "instance-6",
        name: "GPU-Accelerated",
        vcpus: 8,
        memory: "32 GB",
        price: 0.5,
      },
      {
        id: "instance-7",
        name: "Standard Compute",
        vcpus: 2,
        memory: "4 GB",
        price: 0.05,
      },
      {
        id: "instance-8",
        name: "High-Memory Compute",
        vcpus: 4,
        memory: "16 GB",
        price: 0.15,
      },
      {
        id: "instance-9",
        name: "GPU-Accelerated",
        vcpus: 8,
        memory: "32 GB",
        price: 0.5,
      },
    ],
    storage: [
      {
        id: "storage-1",
        name: "Standard SSD",
        type: "SSD",
        capacity: 100,
        price: 0.1,
      },
      {
        id: "storage-2",
        name: "High-Performance SSD",
        type: "NVMe",
        capacity: 500,
        price: 0.3,
      },
    ],
    bandwidth: [
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
    osImages: [
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
      {
        id: "os-4",
        name: "Fedora 38",
        logo: "https://placehold.co/40x40/1A004F/ffffff?text=F",
        price: 0.0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#121212]">
        Configure Your Cloud Solution
      </h3>
      <p className="text-gray-600">
        Choose the resources that best fit your project requirements.
      </p>

      {/* Instance Selection */}
      <div className="space-y-4">
        <label className="block text-lg font-medium text-[#121212]">
          Compute Instance
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
              {mockData.instances.map((item) => (
                <tr
                  key={item.id}
                  className={`cursor-pointer transition-colors duration-200 ${
                    selectedOptions.instance?.id === item.id
                      ? "bg-[#ECF6FE]"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelect("instance", item)}
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
                    {selectedOptions.instance?.id === item.id ? (
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

      {/* Storage Selection */}
      <div className="space-y-4">
        <label className="block text-lg font-medium text-[#121212]">
          Storage
        </label>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/mo
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Select</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockData.storage.map((item) => (
                <tr
                  key={item.id}
                  className={`cursor-pointer transition-colors duration-200 ${
                    selectedOptions.storage?.id === item.id
                      ? "bg-[#ECF6FE]"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelect("storage", item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.capacity} GB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${item.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {selectedOptions.storage?.id === item.id ? (
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

      {/* Bandwidth Selection */}
      <div className="space-y-4">
        <label className="block text-lg font-medium text-[#121212]">
          Bandwidth
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
              {mockData.bandwidth.map((item) => (
                <tr
                  key={item.id}
                  className={`cursor-pointer transition-colors duration-200 ${
                    selectedOptions.bandwidth?.id === item.id
                      ? "bg-[#ECF6FE]"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelect("bandwidth", item)}
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
                    {selectedOptions.bandwidth?.id === item.id ? (
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

      {/* OS Image Selection */}
      <div className="space-y-4">
        <label className="block text-lg font-medium text-[#121212]">
          Operating System
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
              {mockData.osImages.map((item) => (
                <tr
                  key={item.id}
                  className={`cursor-pointer transition-colors duration-200 ${
                    selectedOptions.osImage?.id === item.id
                      ? "bg-[#ECF6FE]"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelect("osImage", item)}
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
                    {selectedOptions.osImage?.id === item.id ? (
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

      <div className="flex justify-end mt-8">
        <button
          onClick={handleNext}
          disabled={!isFormValid}
          className={`px-8 py-3 rounded-full text-white font-medium transition-colors duration-200 flex items-center justify-center ${
            isFormValid
              ? "bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8]  hover:bg-[#1976D2] hover:animate-pulse"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Next Step <ChevronRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
