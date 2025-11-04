import React from "react";
import { Loader2, Trash2, X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useDeleteProductPricing } from "../../../hooks/adminHooks/adminproductPricingHook";

const DeleteProductPricingModal = ({ isOpen, onClose, pricing }) => {
  const { mutate: deletePricing, isPending } = useDeleteProductPricing();

  if (!isOpen || !pricing) {
    return null;
  }

  const handleConfirm = () => {
    deletePricing(pricing.id, {
      onSuccess: () => {
        ToastUtils.success("Pricing entry removed.");
        onClose();
      },
      onError: () => {
        ToastUtils.error("Failed to delete pricing entry. Please try again.");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 font-Outfit">
      <div className="w-full max-w-[460px] rounded-[24px] bg-white shadow-lg">
        <div className="flex items-center justify-between rounded-t-[24px] border-b bg-red-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-red-600">
            Remove pricing entry
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-red-400 transition hover:text-red-500"
            aria-label="Close"
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6 text-sm text-slate-600">
          <p>
            You&apos;re about to remove the pricing entry for{" "}
            <span className="font-semibold text-slate-900">
              {pricing.product_name || "this product"}
            </span>
            . This action disables the SKU for quoting in{" "}
            <span className="font-semibold text-slate-900">
              {pricing.region || "the selected region"}
            </span>
            .
          </p>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Price: ${Number(pricing.price_usd || 0).toFixed(2)}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Provider: {pricing.provider || "—"}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">
                Country: {pricing.country_code || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
          >
            Delete
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProductPricingModal;
