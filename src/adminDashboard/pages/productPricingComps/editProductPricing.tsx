// @ts-nocheck
import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useUpdateProductPricing } from "../../../hooks/adminHooks/adminproductPricingHook";

const EditProductPricingModal = ({ isOpen, onClose, pricing }: any) => {
  const [priceUsd, setPriceUsd] = useState("");
  const [errors, setErrors] = useState({});
  const { mutate: updatePricing, isPending } = useUpdateProductPricing();

  useEffect(() => {
    if (isOpen && pricing) {
      setPriceUsd(pricing.price_usd ?? "");
      setErrors({});
    }
    if (!isOpen) {
      setPriceUsd("");
      setErrors({});
    }
  }, [isOpen, pricing]);

  if (!isOpen || !pricing) {
    return null;
  }

  const validate = () => {
    const nextErrors = {};
    const numericPrice = Number(priceUsd);
    if (!priceUsd || Number.isNaN(numericPrice)) {
      nextErrors.price_usd = "Enter a valid price.";
    } else if (numericPrice <= 0) {
      nextErrors.price_usd = "Price must be greater than zero.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    if (!validate()) return;

    updatePricing(
      {
        id: pricing.id,
        pricingData: {
          price_usd: Number(priceUsd),
          product_id: pricing.product_id,
          provider: pricing.provider,
          region: pricing.region,
          country_code: pricing.country_code,
        },
      },
      {
        onSuccess: () => {
          ToastUtils.success("Pricing updated successfully.");
          onClose();
        },
        onError: () => {
          ToastUtils.error("Failed to update pricing. Please review the details and try again.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 font-Outfit">
      <div className="w-full max-w-[520px] rounded-[24px] bg-white shadow-xl">
        <div className="flex items-center justify-between rounded-t-[24px] border-b bg-[#F2F2F2] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#575758]">Edit Pricing Entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition hover:text-[#1E1E1EB2]"
            aria-label="Close"
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{pricing.product_name}</p>
            <p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Region: {pricing.region || "—"}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Provider: {pricing.provider || "—"}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Country: {pricing.country_code || "—"}
              </span>
            </p>
          </div>

          <div>
            <label htmlFor="price_usd" className="mb-2 block text-sm font-medium text-slate-600">
              Price (USD)
            </label>
            <input
              id="price_usd"
              name="price_usd"
              type="number"
              step="0.01"
              value={priceUsd}
              onChange={(event) => {
                setPriceUsd(event.target.value);
                setErrors((prev) => ({ ...prev, price_usd: null }));
              }}
              className={`w-full rounded-xl border px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 ${
                errors.price_usd ? "border-red-300 focus:border-red-400" : "border-slate-200"
              }`}
              placeholder="Enter new price"
              min="0"
              disabled={isPending}
            />
            {errors.price_usd && <p className="mt-1 text-xs text-red-500">{errors.price_usd}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[#288DD1] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#1f7ab6] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
            >
              Save changes
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductPricingModal;
