import React, { useMemo, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { formatPrice, getCurrencySymbol } from "../../../utils/resource";
import { useFetchCountries, useFetchProfile } from "../../../hooks/resource";
import { useCreateTenantQuote } from "../../../hooks/quoteHooks";

const PricingSummary = ({ pricingData, currency }) => {
  if (!pricingData?.line_items || !pricingData?.amounts) {
    return <div className="text-gray-600">No pricing data available.</div>;
  }

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="space-y-6">
      <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
        Pricing Summary
      </h4>
      <div className="space-y-2">
        {pricingData.line_items.map((line, index) => (
          <div key={index} className="flex justify-between py-1">
            <span className="font-medium text-gray-700 text-base md:text-lg lg:text-xl">
              {line.name}
            </span>
            <span className="text-gray-600 text-base md:text-lg lg:text-xl">
              {line.quantity} x {currencySymbol}
              {formatPrice(line.unit_amount, line.currency)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t pt-4">
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700 text-base md:text-lg lg:text-xl">
            Pre-Discount Subtotal:
          </span>
          <span className="text-gray-600 text-base md:text-lg lg:text-xl">
            {currencySymbol}
            {formatPrice(pricingData.amounts.pre_discount_subtotal, currency)}
          </span>
        </div>
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700 text-base md:text-lg lg:text-xl">
            Subtotal:
          </span>
          <span className="text-gray-600 text-base md:text-lg lg:text-xl">
            {currencySymbol}
            {formatPrice(pricingData.amounts.subtotal, currency)}
          </span>
        </div>
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700 text-base md:text-lg lg:text-xl">
            Tax ({(pricingData.amounts.tax_rate * 100).toFixed(2)}%):
          </span>
          <span className="text-gray-600 text-base md:text-lg lg:text-xl">
            {currencySymbol}
            {formatPrice(pricingData.amounts.tax, currency)}
          </span>
        </div>
        {pricingData.amounts.discount > 0 && (
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700 text-base md:text-lg lg:text-xl">
              Discount (
              {pricingData.amounts.discount_type === "percent"
                ? `${pricingData.amounts.discount_value}%`
                : "Fixed"}
              ):
            </span>
            <span className="text-gray-600 text-base md:text-lg lg:text-xl">
              -{currencySymbol}
              {formatPrice(pricingData.amounts.discount, currency)}
            </span>
          </div>
        )}
        <div className="flex justify-between py-1">
          <p className="text-base md:text-lg lg:text-xl font-bold text-[#121212]">
            Estimated Total:
          </p>
          <p className="text-base md:text-lg lg:text-xl font-bold text-[#288DD1]">
            {currencySymbol}
            {formatPrice(pricingData.amounts.total, currency)}
          </p>
        </div>
      </div>
    </div>
  );
};

export const TenantStep2Summary = ({ billingData, handlePrev }) => {
  const [quoteData, setQuoteData] = useState(null);
  const { data: countries, isFetching } = useFetchCountries();
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();
  const { mutate, isPending } = useCreateTenantQuote();

  const [formData, setFormData] = useState({
    email: "",
    emails: [""],
    subject: "",
    notes: "",
    bill_to_name: "",
    country: "",
    discount: {
      type: "percent",
      value: 0,
      label: "",
    },
  });

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
        discount: formData.discount.value
          ? {
              type: formData.discount.type,
              value: Number(formData.discount.value),
              label: formData.discount.label,
            }
          : undefined,
      },
      tenant_id: profile?.tenant_id || "", // Use tenant_id from profile
      email: formData.email,
      emails: formData.emails.filter((email) => email.trim() !== ""),
      subject: formData.subject,
      notes: formData.notes,
      bill_to_name: formData.bill_to_name,
      country: formData.country,
    }),
    [billingData, formData, profile]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmailsChange = (index, value) => {
    setFormData((prev) => {
      const newEmails = [...prev.emails];
      newEmails[index] = value;
      return { ...prev, emails: newEmails };
    });
  };

  const addEmailField = () => {
    setFormData((prev) => ({
      ...prev,
      emails: [...prev.emails, ""],
    }));
  };

  const removeEmailField = (index) => {
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }));
  };

  const handleDiscountChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "value") {
      newValue = Math.max(0, parseFloat(value) || 0);
      if (formData.discount.type === "percent") {
        newValue = Math.min(100, newValue);
      }
    }
    setFormData((prev) => ({
      ...prev,
      discount: { ...prev.discount, [name]: newValue },
    }));
  };

  const handleFinalSubmit = () => {
    mutate(formattedData, {
      onSuccess: (data) => {
        console.log("Quote data:", data);
        setQuoteData(data);
      },
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    });
  };

  const handleReset = () => {
    window.location.reload();
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
        Review your selected resources and enter additional details below.
      </p>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-6">
        {quoteData && quoteData.amounts ? (
          <>
            <PricingSummary
              pricingData={quoteData}
              currency={quoteData.amounts.currency || "USD"}
            />
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 rounded-full text-gray-700 font-medium bg-gray-200 hover:bg-gray-300"
              >
                <RefreshCcw className="w-4 h-4" />
                <span className="ml-2">Reset</span>
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="text-gray-600 mb-4">Waiting for quote data...</div>
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold text-[#121212] mb-2">
                Additional Information
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter primary email"
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Emails
                  </label>
                  {formData.emails.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 mb-2"
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                          handleEmailsChange(index, e.target.value)
                        }
                        placeholder="Enter additional email"
                        className="flex-1 w-full input-field"
                      />
                      {formData.emails.length > 1 && (
                        <button
                          onClick={() => removeEmailField(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addEmailField}
                    className="text-[#288DD1] hover:text-[#1976D2] text-sm"
                  >
                    + Add another email
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Enter subject"
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Enter notes"
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill To Name
                  </label>
                  <input
                    type="text"
                    name="bill_to_name"
                    value={formData.bill_to_name}
                    onChange={handleInputChange}
                    placeholder="Enter bill to name"
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full input-field"
                    disabled={isFetching}
                  >
                    <option value="">Select Country</option>
                    {countries?.map((country) => (
                      <option key={country.name} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-[#121212] mb-2">
                    Discount
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Type
                      </label>
                      <select
                        name="type"
                        value={formData.discount.type}
                        onChange={handleDiscountChange}
                        className="w-full input-field"
                      >
                        <option value="percent">Percent</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Value
                      </label>
                      <input
                        type="number"
                        name="value"
                        value={formData.discount.value}
                        onChange={handleDiscountChange}
                        placeholder="Enter discount value"
                        min={0}
                        max={
                          formData.discount.type === "percent" ? 100 : undefined
                        }
                        className="w-full input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Label
                      </label>
                      <input
                        type="text"
                        name="label"
                        value={formData.discount.label}
                        onChange={handleDiscountChange}
                        placeholder="Enter discount label"
                        className="w-full input-field"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {!quoteData || !quoteData.amounts ? (
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrev}
            className="px-6 py-3 rounded-full text-gray-700 font-medium bg-gray-200 hover:bg-gray-300"
          >
            Previous
          </button>
          <button
            onClick={handleFinalSubmit}
            disabled={isPending}
            className="px-6 py-3 rounded-full text-white font-medium bg-[#288DD1] hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Quote
          </button>
        </div>
      ) : null}
    </div>
  );
};
