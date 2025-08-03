import { useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCreateLeads } from "../../hooks/leadsHook";

export const Step3Breakdown = ({ billingData, personalInfo, handlePrev }) => {
  const { mutate, isPending, data } = useCreateLeads();

  const formattedData = useMemo(
    () => ({
      user: {
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        email: personalInfo.email,
        phone: personalInfo.phone,
        company: personalInfo.company,
        country_iso: personalInfo.country_iso,
        lead_type: personalInfo.lead_type,
        source: personalInfo.source,
        notes: personalInfo.notes,
      },
      pricing_request: {
        compute_instance_id: billingData.compute_instance_id,
        ebs_volumes: billingData.volumes.map((volume) => ({
          ebs_volume_id: volume.ebs_volume_id,
          storage_size_gb: volume.capacity,
        })),
        os_image_id: billingData.os_image_id,
        months: billingData.months,
        number_of_instances: billingData.number_of_instances,
        bandwidth_id: billingData.bandwidth_id,
        package_id: null,
        bandwidth_count: billingData.floating_ip_count,
        floating_ip_count: billingData.floating_ip_count,
        cross_connect_id: billingData.cross_connect_id,
      },
    }),
    [billingData, personalInfo]
  );

  useEffect(() => {
    // console.log(JSON.stringify(formattedData, null, 2));
    mutate(formattedData);
  }, []);

  const renderComputeBreakdown = () => (
    <div className="space-y-2">
      <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
        Compute & OS
      </h4>
      <div className="flex justify-between py-1">
        <span className="font-medium text-gray-700">Flavor:</span>
        <span className="text-gray-600">{billingData.compute_instance_id}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="font-medium text-gray-700">OS:</span>
        <span className="text-gray-600">{billingData.os_image_id}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="font-medium text-gray-700">Runtime:</span>
        <span className="text-gray-600">{billingData.months} months</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="font-medium text-gray-700">Instances:</span>
        <span className="text-gray-600">{billingData.number_of_instances}</span>
      </div>
    </div>
  );

  const renderStorageBreakdown = () => (
    <div className="space-y-2">
      <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
        Block Storage
      </h4>
      {billingData.volumes.map((volume, index) => (
        <div key={index} className="flex justify-between py-1">
          <span className="font-medium text-gray-700">Volume {index + 1}:</span>
          <span className="text-gray-600">{volume.capacity} GB</span>
        </div>
      ))}
    </div>
  );

  const renderNetworkingBreakdown = () => (
    <div className="space-y-2">
      <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
        Networking
      </h4>
      <div className="flex justify-between py-1">
        <span className="font-medium text-gray-700">Public IPs:</span>
        <span className="text-gray-600">{billingData.floating_ip_count}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="font-medium text-gray-700">Bandwidth:</span>
        <span className="text-gray-600">{billingData.bandwidth_id}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="font-medium text-gray-700">Runtime:</span>
        <span className="text-gray-600">{billingData.months} months</span>
      </div>
      {billingData.cross_connect_id && (
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700">Cross Connect:</span>
          <span className="text-gray-600">Included</span>
        </div>
      )}
    </div>
  );

  const displayLeadType =
    personalInfo.lead_type === "client" ? "User" : personalInfo.lead_type;

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#288DD1]" />
        <p className="mt-4 text-gray-700 text-lg">
          Calculating your estimated cost...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-Outfit">
      <h3 className="text-2xl font-semibold text-[#121212]">
        Your Cloud Solution Breakdown
      </h3>
      <p className="text-gray-600">
        Here is a detailed summary of your configured resources and the
        estimated cost.
      </p>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-4">
        <div className="space-y-6">
          {billingData.compute_instance_id && renderComputeBreakdown()}
          {billingData.volumes?.length > 0 && renderStorageBreakdown()}
          {billingData.floating_ip_count > 0 &&
            billingData.bandwidth_id &&
            renderNetworkingBreakdown()}
        </div>
        <div className="border-t pt-4">
          <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
            Personal Information
          </h4>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">First Name:</span>
            <span className="text-gray-600">{personalInfo.first_name}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Last Name:</span>
            <span className="text-gray-600">{personalInfo.last_name}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Email:</span>
            <span className="text-gray-600">{personalInfo.email}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Phone:</span>
            <span className="text-gray-600">{personalInfo.phone}</span>
          </div>
          {personalInfo.company && (
            <div className="flex justify-between py-1">
              <span className="font-medium text-gray-700">Company:</span>
              <span className="text-gray-600">{personalInfo.company}</span>
            </div>
          )}
          {personalInfo.country_iso && (
            <div className="flex justify-between py-1">
              <span className="font-medium text-gray-700">Country:</span>
              <span className="text-gray-600">{personalInfo.country_iso}</span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Role:</span>
            <span className="text-gray-600">{displayLeadType}</span>
          </div>
          {personalInfo.source && (
            <div className="flex justify-between py-1">
              <span className="font-medium text-gray-700">Source:</span>
              <span className="text-gray-600">{personalInfo.source}</span>
            </div>
          )}
          {personalInfo.notes && (
            <div className="flex justify-between py-1">
              <span className="font-medium text-gray-700">Notes:</span>
              <span className="text-gray-600">{personalInfo.notes}</span>
            </div>
          )}
        </div>
        <div className="border-t pt-4 text-center">
          <p className="text-2xl font-bold text-[#121212]">
            Estimated Total Cost
          </p>
          <p className="text-5xl font-extrabold text-[#288DD1] mt-2">
            ${data?.total_cost?.toFixed(2) || "0.00"}
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
