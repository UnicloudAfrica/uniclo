// @ts-nocheck
import React from "react";
import { Loader2, Trash2, X } from "lucide-react";
import ToastUtils from "../../../../utils/toastUtil";
import { useDeleteProduct } from "../../../../hooks/adminHooks/adminProductHooks";
import { useDeleteProductPricing } from "../../../../hooks/adminHooks/adminproductPricingHook";

const DeleteObjectStorageTierModal = ({ isOpen, onClose, tier, onDeleted }: any) => {
  const { mutate: deleteProduct, isPending: isDeletingProduct } = useDeleteProduct();
  const { mutate: deletePricing, isPending: isDeletingPricing } = useDeleteProductPricing();

  if (!isOpen || !tier) {
    return null;
  }

  const isPending = isDeletingProduct || isDeletingPricing;

  const proceedWithProductDelete = () => {
    if (!tier.product?.id) {
      onClose?.();
      return;
    }

    deleteProduct(tier.product.id, {
      onSuccess: () => {
        ToastUtils.success("Object storage tier removed.");
        onDeleted?.(tier);
        onClose?.();
      },
      onError: (error) => {
        console.error("Failed to delete Silo Storage product", error);
        ToastUtils.error(
          error?.response?.data?.message || "Failed to delete Silo Storage tier. Please try again."
        );
      },
    });
  };

  const handleDelete = () => {
    if (tier.pricing?.id) {
      deletePricing(tier.pricing.id, {
        onSuccess: proceedWithProductDelete,
        onError: (error) => {
          console.warn("Failed to delete pricing entry, continuing", error);
          proceedWithProductDelete();
        },
      });
      return;
    }

    proceedWithProductDelete();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 font-Outfit">
      <div className="w-full max-w-[500px] rounded-[24px] bg-white shadow-xl">
        <div className="flex items-center justify-between rounded-t-[24px] border-b bg-[#FEE2E2] px-6 py-4">
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Delete Object Storage Tier</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-red-400 transition hover:text-red-600"
            aria-label="Close"
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6 text-sm text-slate-600">
          <p>
            Are you sure you want to remove the tier
            <span className="font-semibold text-slate-900">
              {" "}
              {tier.product?.name || "this tier"}
            </span>
            ?
          </p>
          <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            This will delete the SKU from inventory along with its pricing entry. Tenants who rely
            on this tier will no longer see it available for orders until you re-add it.
          </p>
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
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
          >
            Delete tier
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteObjectStorageTierModal;
