import React, { useMemo } from "react";

export const Step3Breakdown = ({ billingData, personalInfo, handlePrev }) => {
  const mockData = {
    compute_flavors: {
      "flavor-1": {
        name: "Standard Compute",
        price: 0.05,
        vcpus: 2,
        memory: "4 GB",
      },
      "flavor-2": {
        name: "High-Memory Compute",
        price: 0.15,
        vcpus: 4,
        memory: "16 GB",
      },
      "flavor-3": {
        name: "GPU-Accelerated",
        price: 0.5,
        vcpus: 8,
        memory: "32 GB",
      },
    },
    os_images: {
      "os-1": { name: "Ubuntu 22.04 LTS", price: 0.0 },
      "os-2": { name: "Windows Server 2022", price: 0.02 },
      "os-3": { name: "CentOS 8 Stream", price: 0.0 },
    },
    ebs_volumes: {
      "volume-1": { name: "Standard SSD", price: 0.1, capacity: 100 },
      "volume-2": { name: "High-Performance SSD", price: 0.3, capacity: 500 },
    },
    ip_bandwidths: {
      "bandwidth-1": {
        name: "Standard Bandwidth",
        price: 0.01,
        speed: "100 Mbps",
      },
      "bandwidth-2": {
        name: "High-Speed Bandwidth",
        price: 0.03,
        speed: "1 Gbps",
      },
    },
    floating_ip_price: 5.0, // $5 per month per IP
    cross_connect_price: 100.0, // A fixed price for a cross connect
  };

  const calculateTotal = useMemo(() => {
    let total = 0;

    // Calculate Compute & OS cost
    if (billingData.compute_flavor_id) {
      const flavor = mockData.compute_flavors[billingData.compute_flavor_id];
      const osImage = mockData.os_images[billingData.os_image_id];
      const hourlyCost = flavor.price + osImage.price;
      total += hourlyCost * 24 * billingData.runtime_days;
    }

    // Calculate Block Storage cost
    if (billingData.volumes && billingData.volumes.length > 0) {
      const monthlyStorageCost = billingData.volumes.reduce((sum, volume) => {
        const volumeData = mockData.ebs_volumes[volume.ebs_volume_id];
        return sum + volumeData.price * volumeData.capacity * volume.quantity;
      }, 0);
      total += (monthlyStorageCost / 30) * billingData.runtime_days;
    }

    // Calculate Networking cost
    if (billingData.floating_ip_count > 0 && billingData.ip_bandwidth_id) {
      const bandwidth = mockData.ip_bandwidths[billingData.ip_bandwidth_id];
      const ipCost = mockData.floating_ip_price * billingData.floating_ip_count;
      // Assuming 1000 GB transfer per IP for simplicity
      const estimatedDataTransferCost =
        bandwidth.price * 1000 * billingData.floating_ip_count;
      total +=
        (ipCost + estimatedDataTransferCost) *
        (billingData.ip_runtime_days / 30);
    }

    // Add Cross Connect cost
    if (billingData.cross_connect) {
      total += mockData.cross_connect_price;
    }

    return total.toFixed(2);
  }, [billingData, mockData]);

  const totalCost = calculateTotal;

  const renderComputeBreakdown = () => {
    const flavor = mockData.compute_flavors[billingData.compute_flavor_id];
    const osImage = mockData.os_images[billingData.os_image_id];
    return (
      <div className="space-y-2">
        <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
          Compute & OS
        </h4>
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700">Flavor:</span>
          <span className="text-gray-600">{flavor.name}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700">OS:</span>
          <span className="text-gray-600">{osImage.name}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700">Runtime:</span>
          <span className="text-gray-600">{billingData.runtime_days} days</span>
        </div>
      </div>
    );
  };

  const renderStorageBreakdown = () => {
    return (
      <div className="space-y-2">
        <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
          Block Storage
        </h4>
        {billingData.volumes.map((volume) => {
          const volumeData = mockData.ebs_volumes[volume.ebs_volume_id];
          return (
            <div
              key={volume.ebs_volume_id}
              className="flex justify-between py-1"
            >
              <span className="font-medium text-gray-700">
                {volumeData.name}:
              </span>
              <span className="text-gray-600">
                {volume.quantity} x {volumeData.capacity} GB
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderNetworkingBreakdown = () => {
    const bandwidth = mockData.ip_bandwidths[billingData.ip_bandwidth_id];
    return (
      <div className="space-y-2">
        <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
          Networking
        </h4>
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700">Public IPs:</span>
          <span className="text-gray-600">{billingData.floating_ip_count}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700">IP Bandwidth:</span>
          <span className="text-gray-600">
            {bandwidth.name} ({bandwidth.speed})
          </span>
        </div>
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700">IP Runtime:</span>
          <span className="text-gray-600">
            {billingData.ip_runtime_days} days
          </span>
        </div>
        {billingData.cross_connect && (
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Cross Connect:</span>
            <span className="text-gray-600">Included</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#121212]">
        Your Cloud Solution Breakdown
      </h3>
      <p className="text-gray-600">
        Here is a detailed summary of your configured resources and the
        estimated cost.
      </p>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-4">
        <div className="space-y-6">
          {billingData.compute_flavor_id && renderComputeBreakdown()}
          {billingData.volumes &&
            billingData.volumes.length > 0 &&
            renderStorageBreakdown()}
          {billingData.floating_ip_count > 0 &&
            billingData.ip_bandwidth_id &&
            renderNetworkingBreakdown()}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
            Personal Information
          </h4>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Full Name:</span>
            <span className="text-gray-600">{personalInfo.fullName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Email:</span>
            <span className="text-gray-600">{personalInfo.email}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Role:</span>
            <span className="text-gray-600">{personalInfo.role}</span>
          </div>
        </div>

        <div className="border-t pt-4 text-center">
          <p className="text-2xl font-bold text-[#121212]">
            Estimated Total Cost
          </p>
          <p className="text-5xl font-extrabold text-[#288DD1] mt-2">
            ${totalCost}
          </p>
        </div>
      </div>

      <div className="flex justify-start mt-8">
        <button
          onClick={handlePrev}
          className="px-6 py-3 rounded-full text-gray-700 font-medium transition-colors duration-200 bg-gray-200 hover:bg-gray-300"
        >
          Previous
        </button>
      </div>
    </div>
  );
};
