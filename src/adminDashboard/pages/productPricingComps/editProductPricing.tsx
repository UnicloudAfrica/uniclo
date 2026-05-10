import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import ToastUtils from "@/utils/toastUtil";
import { useUpdateProductPricing } from "@/hooks/adminHooks/adminProductPricingHooks";

type PricingShape = {
  id?: string | number;
  price_usd?: string | number;
  product_id?: string | number;
  product_name?: string;
  provider?: string;
  region?: string;
  country_code?: string;
  availability_zone?: string;
};

const EditProductPricingModal = ({
  isOpen,
  onClose,
  pricing,
}: {
  isOpen: boolean;
  onClose: () => void;
  pricing: unknown;
}) => {
  const [priceUsd, setPriceUsd] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { mutate: updatePricing, isPending } = useUpdateProductPricing();

  const pricingShape = pricing as PricingShape | null;

  useEffect(() => {
    if (isOpen && pricingShape) {
      setPriceUsd(String(pricingShape.price_usd ?? ""));
      setErrors({});
    }
    if (!isOpen) {
      setPriceUsd("");
      setErrors({});
    }
  }, [isOpen, pricingShape]);

  if (!isOpen || !pricingShape) {
    return null;
  }

  const validate = () => {
    const nextErrors: Record<string, string | null> = {};
    const numericPrice = Number(priceUsd);
    if (!priceUsd || Number.isNaN(numericPrice)) {
      nextErrors.price_usd = "Enter a valid price.";
    } else if (numericPrice <= 0) {
      nextErrors.price_usd = "Price must be greater than zero.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).filter((k) => nextErrors[k]).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    updatePricing(
      {
        id: pricingShape.id,
        pricingData: {
          price_usd: Number(priceUsd),
          product_id: pricingShape.product_id,
          provider: pricingShape.provider,
          region: pricingShape.region,
          country_code: pricingShape.country_code,
          ...(pricingShape.availability_zone
            ? { availability_zone: pricingShape.availability_zone }
            : {}),
        },
      } as never,
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
        <div className="flex items-center justify-between rounded-t-[24px] border-b bg-[var(--theme-surface-alt)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--theme-text-color)]">
            Edit Pricing Entry
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition hover:text-[rgb(var(--theme-neutral-900) / 0.7)]"
            aria-label="Close"
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{pricingShape.product_name}</p>
            <p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Region: {pricingShape.region || "—"}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Provider: {pricingShape.provider || "—"}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Country: {pricingShape.country_code || "—"}
              </span>
              {pricingShape.availability_zone && (
                <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                  AZ: {pricingShape.availability_zone}
                </span>
              )}
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
              className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-color)] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[rgb(var(--theme-color-500))] disabled:cursor-not-allowed disabled:opacity-60"
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
