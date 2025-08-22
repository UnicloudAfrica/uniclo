import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCreateLeads } from "../../../hooks/leadsHook";
import GeneratePDF from "./generatePdf";

const formatPrice = (amount, currencyCode) => {
  if (typeof amount !== "number") {
    amount = parseFloat(amount);
  }
  if (isNaN(amount)) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: "symbol",
  }).format(amount);
};

export const Step2Summary = ({ billingData, handlePrev }) => {
  const { mutate, isPending, data, isSuccess } = useCreateLeads();
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(null);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState(null);

  const pricingSummary = useMemo(() => {
    if (!isSuccess || !data?.pricing) return null;
    const subtotal = data.pricing.subtotal || 0;
    const tax = data.pricing.tax || 0;
    const discount = discountApplied ? subtotal * 0.1 : 0; // 10% discount if applied
    const total = subtotal + tax - discount;
    return {
      lines: data.pricing.lines || [],
      currency: data.pricing.currency || "USD",
      subtotal,
      tax,
      discount,
      total,
    };
  }, [data, isSuccess, discountApplied]);

  console.log(billingData);

  const formattedData = useMemo(
    () => ({
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
        currency: billingData.currency === "Nigeria" ? "NGN" : "USD",
      },
    }),
    [billingData]
  );

  const handleFinalSubmit = () => {
    mutate(formattedData);
  };

  const applyDiscount = () => {
    if (discountCode.toLowerCase() === "save10") {
      setDiscountApplied(true);
      setDiscountCode("");
    } else {
      setDiscountApplied(false);
    }
  };

  const sendSummaryEmail = async () => {
    if (!email || !pricingSummary) {
      setEmailStatus("Please enter a valid email address.");
      return;
    }
    setEmailStatus("Sending...");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock API delay
      setEmailStatus("Summary sent successfully!");
      setEmail("");
    } catch (error) {
      setEmailStatus("Failed to send summary. Please try again.");
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#288DD1]" />
        <p className="mt-4 text-[#288DD1] text-lg">
          Submitting your request...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-Outfit">
      <h3 className="text-2xl font-semibold text-[#121212]">
        Your Cloud Solution Summary
      </h3>
      <p className="text-gray-600">
        Review your selected resources and estimated costs below.
      </p>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-4">
        {isSuccess && pricingSummary && (
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
              Pricing Summary
            </h4>
            <div className="space-y-2">
              {pricingSummary.lines.map((line, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="font-medium text-gray-700">{line.name}</span>
                  <span className="text-gray-600">
                    {line.quantity} x{" "}
                    {formatPrice(line.unit_local, line.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between py-1">
                <span className="font-medium text-gray-700">Subtotal:</span>
                <span className="text-gray-600">
                  {formatPrice(
                    pricingSummary.subtotal,
                    pricingSummary.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium text-gray-700">Tax:</span>
                <span className="text-gray-600">
                  {formatPrice(pricingSummary.tax, pricingSummary.currency)}
                </span>
              </div>
              {pricingSummary.discount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="font-medium text-gray-700">
                    Discount (10%):
                  </span>
                  <span className="text-gray-600">
                    -
                    {formatPrice(
                      pricingSummary.discount,
                      pricingSummary.currency
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <p className="text-xl font-bold text-[#121212]">
                  Estimated Total:
                </p>
                <p className="text-xl font-bold text-[#288DD1]">
                  {formatPrice(pricingSummary.total, pricingSummary.currency)}
                </p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold text-[#121212] mb-2">
                Apply Discount
              </h4>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter discount code"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#288DD1]"
                />
                <button
                  onClick={applyDiscount}
                  disabled={!discountCode}
                  className="px-4 py-2 rounded-md text-white bg-[#288DD1] hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
              {discountApplied !== null && (
                <p
                  className={`text-sm mt-2 ${
                    discountApplied ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {discountApplied
                    ? "Discount applied successfully!"
                    : "Invalid discount code."}
                </p>
              )}
            </div>
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold text-[#121212] mb-2">
                Share Summary
              </h4>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to send summary"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#288DD1]"
                  />
                  <button
                    onClick={sendSummaryEmail}
                    disabled={!email || isPending}
                    className="px-4 py-2 rounded-md text-white bg-[#288DD1] hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Email
                  </button>
                </div>
                {emailStatus && (
                  <p
                    className={`text-sm ${
                      emailStatus.includes("successfully")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {emailStatus}
                  </p>
                )}
                <GeneratePDF pricingSummary={pricingSummary} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-start mt-8">
        <button
          onClick={handlePrev}
          className="px-6 py-3 rounded-full text-gray-700 font-medium bg-gray-200 hover:bg-gray-300"
        >
          Previous
        </button>
      </div>
    </div>
  );
};
