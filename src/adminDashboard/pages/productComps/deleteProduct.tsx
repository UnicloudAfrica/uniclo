import { X, Loader2 } from "lucide-react";
import { useDeleteProduct } from "@/hooks/adminHooks/adminProductHooks";
import logger from "@/utils/logger";

const DeleteProduct = ({ isOpen, onClose, productId, productName, refetch }: { isOpen: boolean; onClose: () => void; productId: string; productName: string; refetch?: () => void }) => {
  const { mutate: deleteProduct, isPending } = useDeleteProduct();

  const handleDelete = () => {
    if (!productId) return;
    deleteProduct(productId, {
      onSuccess: () => {
        onClose();
        if (refetch) {
          refetch();
        }
      },
      onError: (error: unknown) => logger.error("Error deleting product:", (error as Error)?.message ?? error),
    });
  };

  if (!isOpen || !productId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[600px] mx-4 w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[var(--theme-text-color)]">Delete Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[rgb(var(--theme-neutral-900) / 0.7)]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete "{productName || "this product"}"?
          This also removes any published prices for this SKU across every
          region — the action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[var(--theme-surface-alt)] border border-[var(--theme-surface-alt)] rounded-[30px] text-gray-700"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-8 py-3 bg-red-500 text-white rounded-full flex items-center"
            disabled={isPending}
          >
            Delete
            {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProduct;
