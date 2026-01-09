// Template Gallery - Simple Quick Deploy
import React, { useState } from "react";
import { useInstanceTemplates } from "../../hooks/useInstanceTemplates";
import PricingBreakdown from "./PricingBreakdown";
import { LayoutTemplate, Loader2 } from "lucide-react";

interface TemplateGalleryProps {
  onSelectTemplate?: (template: any) => void;
  onCustomize?: (template: any) => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate, onCustomize }) => {
  const { templates, isLoading, isError } = useInstanceTemplates();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-slate-600">Loading templates...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load templates</p>
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-12">
        <LayoutTemplate className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600">No templates available</p>
      </div>
    );
  }

  const categories = [
    "all",
    ...Array.from(new Set(templates.map((t: any) => t.category).filter(Boolean))),
  ];
  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t: any) => t.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template: any) => (
          <div
            key={template.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{template.name}</h3>
              {template.category && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  {template.category}
                </span>
              )}
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{template.description}</p>
            </div>

            {template.configuration?.compute && (
              <div className="px-6 py-4 bg-slate-50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-slate-600">vCPU</div>
                    <div className="font-semibold text-slate-900">
                      {template.configuration.compute.vcpu}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">RAM</div>
                    <div className="font-semibold text-slate-900">
                      {Math.round(template.configuration.compute.ram_mb / 1024)}GB
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Storage</div>
                    <div className="font-semibold text-slate-900">
                      {template.configuration.volumes?.[0]?.size_gb || 0}GB
                    </div>
                  </div>
                </div>
              </div>
            )}

            {template.pricing_cache && (
              <div className="px-6 py-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold text-primary-600">
                    {template.pricing_cache.currency || "USD"}{" "}
                    {(
                      template.pricing_cache.monthly_total ||
                      template.pricing_cache.monthly_total_usd
                    )?.toFixed(2)}
                  </span>
                  <span className="text-sm text-slate-600">/month</span>
                </div>
                {(template.pricing_cache.yearly_total || template.pricing_cache.yearly_total_usd) <
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
              </div>
            )}

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => onSelectTemplate?.(template)}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Quick Deploy
              </button>
              <button
                onClick={() => onCustomize?.(template)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
              >
                Customize
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateGallery;
