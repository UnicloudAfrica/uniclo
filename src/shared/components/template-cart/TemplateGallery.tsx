// Shared Template Gallery - Works for Admin/Tenant/Client
import React, { useState } from "react";
import { useInstanceTemplates } from "../../../hooks/useInstanceTemplates";
import { useTemplateCart } from "../../../stores/templateCartStore";
import PricingBreakdown from "../../../components/templates/PricingBreakdown";
import { LayoutTemplate, Loader2, ShoppingCart, Check } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";

interface TemplateGalleryProps {
  provider?: string;
  region?: string;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  provider = "zadara",
  region = "africa-lagos",
}) => {
  const { templates, isLoading } = useInstanceTemplates();
  const { addToCart } = useTemplateCart();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showPricingFor, setShowPricingFor] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "web_server", label: "Web Servers" },
    { id: "database", label: "Databases" },
    { id: "development", label: "Development" },
    { id: "ml", label: "Machine Learning" },
  ];

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t: any) => t.category === selectedCategory);

  const handleAddToCart = (template: any) => {
    const quantity = quantities[template.id] || 1;
    addToCart(template, quantity);

    setAddedItems((prev) => new Set(prev).add(template.id));
    ToastUtils.success(`Added ${template.name} to cart!`);

    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(template.id);
        return newSet;
      });
    }, 2000);
  };

  const updateQuantity = (templateId: string, value: number) => {
    const qty = Math.max(1, Math.min(10, value));
    setQuantities((prev) => ({ ...prev, [templateId]: qty }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-slate-600">Loading templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <LayoutTemplate className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No templates available</h3>
        <p className="text-slate-600">Contact your administrator to create instance templates</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:border-primary-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template: any) => {
          const quantity = quantities[template.id] || 1;
          const isAdded = addedItems.has(template.id);

          return (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all overflow-hidden relative"
            >
              {/* Template Card Content */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg mb-1">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{template.description}</p>
                    )}
                  </div>
                  {template.is_featured && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⭐ Featured
                    </span>
                  )}
                </div>

                {/* Specs */}
                {template.configuration?.compute && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                      {template.configuration.compute.vcpu} vCPU
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-medium">
                      {Math.round(template.configuration.compute.ram_mb / 1024)}GB RAM
                    </span>
                    {template.configuration.volumes?.[0] && (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium">
                        {template.configuration.volumes[0].size_gb}GB Storage
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing */}
              {template.pricing_cache && (
                <div className="p-6 bg-slate-50">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-bold text-primary-600">
                      ${template.pricing_cache.monthly_total_usd}
                    </span>
                    <span className="text-sm text-slate-600">/month</span>
                  </div>
                  {(template.pricing_cache.yearly_total ||
                    template.pricing_cache.yearly_total_usd) <
                    (template.pricing_cache.monthly_total ||
                      template.pricing_cache.monthly_total_usd) *
                      12 && (
                    <p className="text-xs text-green-600">
                      Save {template.pricing_cache.currency || "USD"}{" "}
                      {(
                        (template.pricing_cache.monthly_total ||
                          template.pricing_cache.monthly_total_usd) *
                          12 -
                        (template.pricing_cache.yearly_total ||
                          template.pricing_cache.yearly_total_usd)
                      ).toFixed(2)}{" "}
                      with yearly billing
                    </p>
                  )}

                  {showPricingFor === template.id && (
                    <div className="mt-4">
                      <PricingBreakdown pricingData={template.pricing_cache} />
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setShowPricingFor(showPricingFor === template.id ? null : template.id)
                    }
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2"
                  >
                    {showPricingFor === template.id ? "Hide" : "View"} breakdown
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="p-4 bg-white border-t border-slate-100">
                {/* Quantity Selector */}
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm text-slate-600">Quantity:</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(template.id, quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={quantity}
                      onChange={(e) => updateQuantity(template.id, parseInt(e.target.value) || 1)}
                      className="w-12 h-8 text-center border border-slate-300 rounded"
                    />
                    <button
                      onClick={() => updateQuantity(template.id, quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(template)}
                  disabled={isAdded}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
                    isAdded
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : "bg-primary-600 hover:bg-primary-700 text-white"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>

              {/* Popular Badge */}
              {template.total_deployments > 10 && (
                <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                  🔥 Popular
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-slate-600">No templates found in this category</div>
      )}
    </div>
  );
};

export default TemplateGallery;
