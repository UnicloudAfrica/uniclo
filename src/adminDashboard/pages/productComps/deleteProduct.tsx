// @ts-nocheck
import React from "react";
import { X, Loader2 } from "lucide-react";
import { useDeleteProduct } from "../../../hooks/adminHooks/adminProductHooks";

const DeleteProduct = ({ isOpen, onClose, productId, productName, refetch }: any) => {
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
      onError: (error) => console.error("Error deleting product:", error.message),
    });
  };

  if (!isOpen || !productId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[600px] mx-4 w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#575758]">Delete Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete "{productName || "this product"}"?
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] text-gray-700"
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
