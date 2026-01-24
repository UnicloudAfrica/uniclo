// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import ToastUtils from "../../../../utils/toastUtil";
import { useUpdateProductPricing } from "../../../../hooks/adminHooks/adminproductPricingHook";

const formatNumber = (value, digits = 4) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "";
  }
  return Number(value).toFixed(digits);
};

const EditObjectStorageTierModal = ({ isOpen, onClose, tier, onUpdated }: any) => {
  const { mutate: updatePricing, isPending } = useUpdateProductPricing();
  const quota = useMemo(() => tier?.quota ?? 0, [tier]);
  const existingPrice = useMemo(
    () => (tier?.pricing?.price_usd ? Number(tier.pricing.price_usd) : 0),
    [tier]
  );

  const initialPerGb = useMemo(() => {
    if (!quota || !existingPrice) {
      return quota ? existingPrice / quota : 0;
    }
    return existingPrice / quota;
  }, [existingPrice, quota]);

  const [pricePerGb, setPricePerGb] = useState(initialPerGb || 0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setPricePerGb(initialPerGb || 0);
      setErrors({});
    }
  }, [isOpen, initialPerGb]);

  if (!isOpen || !tier) {
    return null;
  }

  const totalPrice = quota ? Number(pricePerGb || 0) * quota : 0;

  const validate = () => {
    const nextErrors = {};
    if (!quota) {
      nextErrors.quota = "Invalid quota for this tier.";
    }
    if (pricePerGb === "" || Number.isNaN(Number(pricePerGb))) {
      nextErrors.pricePerGb = "Enter a valid price per GiB.";
    } else if (Number(pricePerGb) <= 0) {
      nextErrors.pricePerGb = "Price per GiB must be greater than zero.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    if (!tier?.pricing?.id) {
      ToastUtils.error("Pricing record not found for this tier.");
      return;
    }
    if (!validate()) {
      return;
    }

    const payload = {
      id: tier.pricing.id,
      pricingData: {
        price_usd: Number(totalPrice.toFixed(4)),
        product_id: tier.pricing.product_id,
        provider: tier.pricing.provider,
        region: tier.pricing.region,
        country_code: tier.pricing.country_code,
      },
    };

    updatePricing(payload, {
      onSuccess: () => {
        ToastUtils.success("Object storage tier updated.");
        onUpdated?.(tier, Number(totalPrice.toFixed(4)));
        onClose?.();
      },
      onError: (error) => {
        console.error("Failed to update Silo Storage tier", error);
        ToastUtils.error(
          error?.response?.data?.message || "Failed to update Silo Storage tier. Please try again."
        );
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 font-Outfit">
      <div className="w-full max-w-[520px] rounded-[24px] bg-white shadow-xl">
        <div className="flex items-center justify-between rounded-t-[24px] border-b bg-[#F2F2F2] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#575758]">Edit Object Storage Tier</h2>
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
            <p className="font-semibold text-slate-900">{tier.product?.name}</p>
            <p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Region: {tier.product?.region || "—"}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Provider: {tier.product?.provider || "zadara"}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Quota: {quota ? `${quota} GiB` : "—"}
              </span>
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Price per GiB (USD)
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={pricePerGb}
              onChange={(event) => {
                setPricePerGb(event.target.value);
                setErrors((prev) => ({ ...prev, pricePerGb: null }));
              }}
              className={`w-full rounded-xl border px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 ${
                errors.pricePerGb ? "border-red-300 focus:border-red-400" : "border-slate-200"
              }`}
              placeholder="0.1600"
              disabled={isPending}
            />
            {errors.pricePerGb && <p className="mt-1 text-xs text-red-500">{errors.pricePerGb}</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Total for this tier</span>
              <span className="font-semibold text-slate-900">${formatNumber(totalPrice, 4)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Calculated as price per GiB × {quota || 0} GiB.
            </p>
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

export default EditObjectStorageTierModal;
