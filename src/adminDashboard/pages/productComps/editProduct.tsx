import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import { useUpdateProduct } from "../../../hooks/adminHooks/adminProductHooks";
import logger from "../../../utils/logger";

const EditProduct = ({ isOpen, onClose, product, onUpdated }: any) => {
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    productable_type: "",
    productable_id: "",
    provider: "",
  });
  const { mutate: updateProduct, isPending } = useUpdateProduct();
  const { data: regions, isFetching: isRegionsFetching } = useFetchRegions();

  // Initialize formData when product changes
  useEffect(() => {
    if (product && typeof product === "object" && product.id) {
      setFormData({
        name: product.name || "",
        region: product.region || "",
        productable_type: product.productable_type || "",
        productable_id: product.productable_id || "",
        provider: product.provider || "",
        provider_resource_id: product.provider_resource_id || null,
        created_at: product.created_at || "",
        updated_at: product.updated_at || "",
      } as any);
    }
  }, [product]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!product || !product.id) return;
    updateProduct(
      { id: product.id, productData: formData },
      {
        onSuccess: () => {
          onClose();
          if (typeof onUpdated === "function") {
            onUpdated();
          }
        },
        onError: (error) => logger.error("Error updating product:", error.message),
      }
    );
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen || !product || typeof product !== "object" || !product.id) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[600px] mx-4 w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[var(--theme-text-color)]">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[rgb(var(--theme-neutral-900) / 0.7)]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Region</label>
            <select
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] input-field"
              disabled={isRegionsFetching}
              required
            >
              <option value="">Select Region</option>
              {isRegionsFetching ? (
                <option value="" disabled>
                  Loading regions...
                </option>
              ) : (
                regions?.map((region: any) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[var(--theme-surface-alt)] border border-[var(--theme-surface-alt)] rounded-[30px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-[var(--theme-color)] text-white rounded-full flex items-center"
              disabled={isPending}
            >
              Update Product
              {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
