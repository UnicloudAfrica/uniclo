import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/navbar";
import { useSearchParams } from "react-router-dom";
import Footer from "../../components/footer";
import Ads from "../../components/ad";
import { Loader2 } from "lucide-react";
import QuoteResourceStep from "./quoteComps/quoteResourceStep";
import QuoteInfoStep from "./quoteComps/quoteInfoStep";
import QuoteSummaryStep from "./quoteComps/quoteSummaryStep";
import { useCreateLeads } from "../../hooks/leadsHook";
import { useCreatehTenantMultiQuotes } from "../../hooks/calculatorOptionHooks";
import {
  useFetchGeneralRegions,
  useFetchComputerInstances,
  useFetchOsImages,
  useFetchEbsVolumes,
  useFetchBandwidths,
  useFetchFloatingIPs,
  useFetchCrossConnect,
} from "../../hooks/resource";
import { useFetchProfile } from "../../hooks/resource";

const Stepper = ({ current, steps }) => (
  <div className="flex items-center justify-between mb-8 w-full max-w-3xl mx-auto">
    {steps.map((label, idx) => (
      <div key={label} className="flex items-center">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
              idx <= current ? "bg-[#288DD1] text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            {idx + 1}
          </div>
          <p
            className={`text-xs mt-2 transition-colors duration-300 ${
              idx <= current ? "text-[#288DD1]" : "text-gray-500"
            }`}
          >
            {label}
          </p>
        </div>
        {idx < steps.length - 1 && (
          <div
            className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
              idx < current ? "bg-[#288DD1]" : "bg-gray-200"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

const steps = [
  "Add Items",
  "Summary",
  "Quote?",
  "Quote Info",
  "Confirmation",
];

export default function QuoteCalculatorWizard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStep = (() => {
    const p = Number(searchParams.get("wstep"));
    return Number.isFinite(p) && p >= 0 && p <= 4 ? p : 0;
  })();
  const [step, setStep] = useState(initialStep);

  // Single item scratch form (for QuoteResourceStep input controls)
  const [itemForm, setItemForm] = useState({
    region: "",
    compute_instance_id: "",
    os_image_id: "",
    months: 1,
    number_of_instances: 1,
    volume_type_id: "",
    storage_size_gb: 30,
    bandwidth_id: null,
    bandwidth_count: 0,
    floating_ip_id: null,
    floating_ip_count: 0,
    cross_connect_id: null,
  });

  // Collected items for pricing/quote
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});

  const [quoteInfo, setQuoteInfo] = useState({
    subject: "",
    client_id: "",
    email: "",
    emails: "",
    bill_to_name: "",
    notes: "",
  });

  // Prefill email from profile if available
  const { data: profile } = useFetchProfile({
    retry: false,
  });

  useEffect(() => {
    if (profile?.email && !quoteInfo.email) {
      setQuoteInfo((prev) => ({ ...prev, email: profile.email }));
    }
  }, [profile]);

  const updateItemForm = (field, value) =>
    setItemForm((prev) => ({ ...prev, [field]: value }));

  const validateItemForm = () => {
    const e = {};
    if (!itemForm.region) e.region = "Region is required";
    if (!itemForm.compute_instance_id) e.compute_instance_id = "Compute is required";
    if (!itemForm.os_image_id) e.os_image_id = "OS Image is required";
    if (!itemForm.months || Number(itemForm.months) < 1) e.months = "Months must be >= 1";
    if (!itemForm.number_of_instances || Number(itemForm.number_of_instances) < 1)
      e.number_of_instances = "Instance count must be >= 1";
    if (!itemForm.volume_type_id) e.volume_type_id = "Volume type is required";
    if (!itemForm.storage_size_gb || Number(itemForm.storage_size_gb) < 1)
      e.storage_size_gb = "Storage (GB) must be >= 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addCurrentItem = () => {
    if (!validateItemForm()) return;

    // Resolve display names from fetched catalogs
    const ci = computerInstances.find(
      ({ product }) => String(product.productable_id) === String(itemForm.compute_instance_id)
    );
    const os = osImages.find(
      ({ product }) => String(product.productable_id) === String(itemForm.os_image_id)
    );
    const vol = ebsVolumes.find(
      ({ product }) => String(product.productable_id) === String(itemForm.volume_type_id)
    );

    const _display = {
      compute: ci?.product?.name || `Compute ${itemForm.compute_instance_id}`,
      os: os?.product?.name || `OS ${itemForm.os_image_id}`,
      storage: vol?.product?.name
        ? `${vol.product.name} - ${itemForm.storage_size_gb} GB`
        : `${itemForm.volume_type_id} - ${itemForm.storage_size_gb} GB`,
    };

    const newItem = {
      region: itemForm.region,
      compute_instance_id: Number(itemForm.compute_instance_id),
      os_image_id: Number(itemForm.os_image_id),
      months: Number(itemForm.months),
      number_of_instances: Number(itemForm.number_of_instances),
      volume_types: [
        {
          volume_type_id: Number(itemForm.volume_type_id),
          storage_size_gb: Number(itemForm.storage_size_gb),
        },
      ],
      bandwidth_id: itemForm.bandwidth_id ? Number(itemForm.bandwidth_id) : null,
      bandwidth_count: Number(itemForm.bandwidth_count || 0),
      floating_ip_id: itemForm.floating_ip_id ? Number(itemForm.floating_ip_id) : null,
      floating_ip_count: Number(itemForm.floating_ip_count || 0),
      cross_connect_id: itemForm.cross_connect_id ? Number(itemForm.cross_connect_id) : null,
      _display,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItemAt = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  // Estimate (Summary) using leads endpoint
  const { mutate: estimate, isPending: estimating, data: estimateData } = useCreateLeads();

  const handleEstimate = () => {
    if (items.length === 0) {
      setErrors({ form: "Please add at least one item." });
      return;
    }

    // Build one combined request for estimation (using first item for simplicity)
    // For multi-item estimate UIs, you can loop and show multiple blocks.
    const first = items[0];
    const leadPayload = {
      user: {
        first_name: "",
        last_name: "",
        email: quoteInfo.email || "",
        phone: "",
        company: "",
        country: "",
        lead_type: "partner",
        source: "quote-wizard",
        notes: quoteInfo.notes || "",
      },
      pricing_request: {
        compute_instance_id: first.compute_instance_id,
        ebs_volumes: (first.volume_types || []).map((v) => ({
          ebs_volume_id: v.volume_type_id,
          storage_size_gb: v.storage_size_gb,
        })),
        os_image_id: first.os_image_id,
        months: first.months,
        number_of_instances: first.number_of_instances,
        bandwidth_id: first.bandwidth_id,
        package_id: null,
        bandwidth_count: first.bandwidth_count,
        floating_ip_count: first.floating_ip_count,
        cross_connect_id: first.cross_connect_id,
        currency: "USD",
      },
    };

    estimate(leadPayload, {
      onSuccess: () => setStep(1),
    });
  };

  // Decision: want quote?
  const [wantsQuote, setWantsQuote] = useState(null); // null | true | false

  // Submit multi-quotes
  const { mutate: createQuotes, isPending: creating, data: createResp } =
    useCreatehTenantMultiQuotes();

  const toMultiQuotesPayload = useMemo(() => {
    const emailsArray = (quoteInfo.emails || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    return {
      subject: quoteInfo.subject || undefined,
      client_id: quoteInfo.client_id ? Number(quoteInfo.client_id) : undefined,
      email: quoteInfo.email || undefined,
      emails: emailsArray,
      notes: quoteInfo.notes || undefined,
      bill_to_name: quoteInfo.bill_to_name || undefined,
      pricing_requests: items.map((it) => ({
        region: it.region,
        compute_instance_id: it.compute_instance_id,
        os_image_id: it.os_image_id,
        months: it.months,
        number_of_instances: it.number_of_instances,
        volume_types: (it.volume_types || []).map((v) => ({
          volume_type_id: v.volume_type_id,
          storage_size_gb: v.storage_size_gb,
        })),
        bandwidth_id: it.bandwidth_id,
        bandwidth_count: it.bandwidth_count,
        floating_ip_id: it.floating_ip_id,
        floating_ip_count: it.floating_ip_count,
        cross_connect_id: it.cross_connect_id,
      })),
    };
  }, [items, quoteInfo]);

  const handleCreateQuotes = () => {
    // Basic validation
    const e = {};
    if (!quoteInfo.email) e.email = "Primary email is required";
    if (!quoteInfo.bill_to_name) e.bill_to_name = "Bill to name is required";
    if (!quoteInfo.subject) e.subject = "Subject is required";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    createQuotes(toMultiQuotesPayload, {
      onSuccess: () => setStep(4),
    });
  };

  // Persist current step in URL for deep linking
  useEffect(() => {
    const currentUrlStep = Number(searchParams.get("wstep"));
    if (!Number.isFinite(currentUrlStep) || currentUrlStep !== step) {
      setSearchParams({ wstep: String(step) }, { replace: true });
    }
  }, [step]);

  const resetAll = () => {
    setStep(0);
    setItems([]);
    setItemForm({
      region: "",
      compute_instance_id: "",
      os_image_id: "",
      months: 1,
      number_of_instances: 1,
      volume_type_id: "",
      storage_size_gb: 30,
      bandwidth_id: null,
      bandwidth_count: 0,
      floating_ip_id: null,
      floating_ip_count: 0,
      cross_connect_id: null,
    });
    setQuoteInfo({ subject: "", client_id: "", email: "", emails: "", bill_to_name: "", notes: "" });
    setWantsQuote(null);
    setErrors({});
  };

  // Fetch selectable data based on region
  const { data: regions = [], isFetching: isRegionsFetching } = useFetchGeneralRegions();
  const { data: computerInstances = [], isFetching: isComputerInstancesFetching } = useFetchComputerInstances("USD", itemForm.region);
  const { data: osImages = [], isFetching: isOsImagesFetching } = useFetchOsImages("USD", itemForm.region);
  const { data: ebsVolumes = [], isFetching: isEbsVolumesFetching } = useFetchEbsVolumes("USD", itemForm.region);
  const { data: bandwidths = [], isFetching: isBandwidthsFetching } = useFetchBandwidths("USD", itemForm.region);
  const { data: floatingIps = [], isFetching: isFloatingIpsFetching } = useFetchFloatingIPs("USD", itemForm.region);
  const { data: crossConnects = [], isFetching: isCrossConnectsFetching } = useFetchCrossConnect("USD", itemForm.region);

  return (
    <>
      <Navbar />
      <div className="mt-[8em] px-4 md:px-8 lg:px-16 w-full text-[#121212] font-Outfit flex flex-col items-center min-h-screen">
        <div className="flex flex-col items-center">
          <p className="font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
            Quote + Calculator
          </p>
          <p className="text-center font-normal mt-3 text-[#676767] max-w-[800px] text-lg md:text-xl">
            Configure your resources, review pricing, and instantly request a formal quote.
          </p>
        </div>

        <div className="max-w-5xl w-full mt-10 p-6 md:p-10 rounded-[24px] bg-[#FAFAFA] border border-[#ECEDF0] shadow-md">
          <Stepper current={step} steps={steps} />

          {step === 0 && (
            <div className="space-y-6">
              {errors.form && (
                <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{errors.form}</div>
              )}
              <QuoteResourceStep
                formData={itemForm}
                errors={errors}
                updateFormData={updateItemForm}
                handleSelectChange={() => {}}
                regions={regions}
                isRegionsFetching={isRegionsFetching}
                computerInstances={computerInstances}
                isComputerInstancesFetching={isComputerInstancesFetching}
                ebsVolumes={ebsVolumes}
                isEbsVolumesFetching={isEbsVolumesFetching}
                osImages={osImages}
                isOsImagesFetching={isOsImagesFetching}
                bandwidths={bandwidths}
                isBandwidthsFetching={isBandwidthsFetching}
                floatingIps={floatingIps}
                isFloatingIpsFetching={isFloatingIpsFetching}
                crossConnects={crossConnects}
                isCrossConnectsFetching={isCrossConnectsFetching}
                onAddRequest={addCurrentItem}
                pricingRequests={items}
                onRemoveRequest={removeItemAt}
              />

              <div className="flex justify-between">
                <button
                  onClick={addCurrentItem}
                  className="px-6 py-3 rounded-full bg-white border text-[#288DD1] border-[#288DD1] hover:bg-[#f0fbff]"
                >
                  Add Item
                </button>
                <button
                  onClick={handleEstimate}
                  disabled={estimating}
                  className="px-8 py-3 rounded-full text-white font-medium transition-colors duration-200 bg-[#288DD1] hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {estimating ? (
                    <span className="inline-flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Estimating...</span>
                  ) : (
                    "Continue to Summary"
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <QuoteSummaryStep formData={quoteInfo} pricingRequests={items} clients={[]} />

              {/* Pricing Estimate (from /pricing-calculator-leads) */}
              {estimateData?.pricing && (
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Pricing Estimate</h4>
                  <div className="space-y-2 text-sm">
                    {estimateData.pricing.lines?.map((line, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-700">{line.name}</span>
                        <span className="text-gray-900">
                          {line.quantity} x {new Intl.NumberFormat("en-US", { style: "currency", currency: line.currency || estimateData.pricing.currency || "USD" }).format(line.unit_local ?? line.unit_amount ?? 0)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Subtotal</span>
                        <span className="text-gray-900">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: estimateData.pricing.currency || "USD" }).format(estimateData.pricing.subtotal ?? estimateData.pricing.pre_discount_subtotal ?? 0)}
                        </span>
                      </div>
                      {typeof estimateData.pricing.tax !== "undefined" && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Tax</span>
                          <span className="text-gray-900">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: estimateData.pricing.currency || "USD" }).format(estimateData.pricing.tax ?? 0)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-800">Estimated Total</span>
                        <span className="text-lg font-semibold text-[#288DD1]">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: estimateData.pricing.currency || "USD" }).format(estimateData.pricing.total ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <button onClick={() => setStep(0)} className="px-6 py-3 rounded-full bg-white border text-[#288DD1] border-[#288DD1] hover:bg-[#f0fbff]">
                  Back
                </button>
                <div className="flex items-center space-x-3">
                  <button onClick={() => { setWantsQuote(false); setStep(2); }} className="px-6 py-3 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300">
                    No, calculate again
                  </button>
                  <button onClick={() => { setWantsQuote(true); setStep(3); }} className="px-8 py-3 rounded-full text-white font-medium bg-[#288DD1] hover:bg-[#1976D2]">
                    Yes, request a quote
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 text-blue-700 rounded-md text-sm">
                You chose not to request a quote. You can go back to Add Items to adjust and re-calculate.
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-full bg-white border text-[#288DD1] border-[#288DD1] hover:bg-[#f0fbff]">
                  Back to Summary
                </button>
                <button onClick={() => setStep(0)} className="px-8 py-3 rounded-full text-white font-medium bg-[#288DD1] hover:bg-[#1976D2]">
                  Calculate again
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <QuoteInfoStep
                formData={quoteInfo}
                errors={errors}
                updateFormData={(field, value) => setQuoteInfo((p) => ({ ...p, [field]: value }))}
                clients={[]}
                isClientsFetching={false}
              />
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-full bg-white border text-[#288DD1] border-[#288DD1] hover:bg-[#f0fbff]">
                  Back to Summary
                </button>
                <button onClick={handleCreateQuotes} disabled={creating} className="px-8 py-3 rounded-full text-white font-medium bg-[#288DD1] hover:bg-[#1976D2] disabled:opacity-50">
                  {creating ? (
                    <span className="inline-flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</span>
                  ) : (
                    "Submit Quote"
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">Quote Submitted</h3>
              <p className="text-sm text-gray-600">We have generated your quote. A copy has been emailed to the recipients.</p>
              {createResp?.data && (
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs text-gray-700">
{JSON.stringify(createResp.data, null, 2)}
                </pre>
              )}
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="px-6 py-3 rounded-full bg-white border text-[#288DD1] border-[#288DD1] hover:bg-[#f0fbff]">
                  Back
                </button>
                <button onClick={resetAll} className="px-8 py-3 rounded-full text-white font-medium bg-[#288DD1] hover:bg-[#1976D2]">
                  Start another calculation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Ads />
      <Footer />
    </>
  );
}
