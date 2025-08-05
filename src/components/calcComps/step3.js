import React, { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useCreateLeads } from "../../hooks/leadsHook";

export const Step3Breakdown = ({ billingData, personalInfo, handlePrev }) => {
  const { mutate, isPending, data, isSuccess } = useCreateLeads();

  const formattedData = useMemo(
    () => ({
      user: {
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        email: personalInfo.email,
        phone: personalInfo.phone,
        company: personalInfo.company,
        country: personalInfo.country,
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

  const handleFinalSubmit = () => {
    mutate(formattedData);
  };

  const displayLeadType =
    personalInfo.lead_type === "client" ? "User" : personalInfo.lead_type;

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#288DD1]" />
        <p className="mt-4 text-gray-700 text-lg">Submitting your request...</p>
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
        {isSuccess && (
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
              Pricing Breakdown
            </h4>
            <div className="space-y-2">
              {data?.pricing?.lines?.map((line, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="font-medium text-gray-700">{line.name}</span>
                  <span className="text-gray-600">
                    {line.quantity} x {line.currency} {line.unit_local}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between py-1">
                <span className="font-medium text-gray-700">Subtotal:</span>
                <span className="text-gray-600">
                  {data?.pricing?.currency}{" "}
                  {data?.pricing?.subtotal?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium text-gray-700">Tax:</span>
                <span className="text-gray-600">
                  {data?.pricing?.currency} {data?.pricing?.tax?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <p className="text-xl font-bold text-[#121212]">
                  Estimated Total Cost:
                </p>
                <p className="text-xl font-bold text-[#288DD1]">
                  {data?.pricing?.currency} {data?.pricing?.total?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
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
          {personalInfo.country && (
            <div className="flex justify-between py-1">
              <span className="font-medium text-gray-700">Country:</span>
              <span className="text-gray-600">{personalInfo.country}</span>
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
        {/* {isSuccess && (
          <div className="border-t pt-4 text-center">
            <p className="text-green-500 font-medium">
              Your request has been submitted! Your lead ID is:{" "}
              <strong>{data?.lead_id}</strong>.
            </p>
          </div>
        )} */}
      </div>
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrev}
          className="px-6 py-3 rounded-full text-gray-700 font-medium transition-colors duration-200 bg-gray-200 hover:bg-gray-300"
        >
          Previous
        </button>
        {isSuccess ? (
          <a
            href="/sign-up"
            className="px-6 py-3 rounded-full text-white font-medium transition-colors duration-200 bg-[#288DD1] hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign Up Now
          </a>
        ) : (
          <button
            onClick={handleFinalSubmit}
            disabled={isPending}
            className="px-6 py-3 rounded-full text-white font-medium transition-colors duration-200 bg-[#288DD1] hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
};
