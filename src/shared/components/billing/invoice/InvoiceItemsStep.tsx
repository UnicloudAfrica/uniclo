import React, { useMemo, useState } from "react";
import { Cpu, Database, ShoppingCart } from "lucide-react";
import ResourceItemBuilder from "./ResourceItemBuilder";
import StorageItemBuilder from "./StorageItemBuilder";
import InvoiceItemQueue from "./InvoiceItemQueue";
import {
  InvoiceFormData,
  PricingRequest,
  ObjectStorageRequest,
  ProductPricing,
  BillingRegion,
  UpdateInvoiceFormData,
} from "../types";

interface InvoiceItemsStepProps {
  formData: InvoiceFormData;
  errors: Record<string, string | null>;
  updateFormData: UpdateInvoiceFormData;
  regions: BillingRegion[] | undefined;
  isRegionsFetching: boolean;
  computerInstances: ProductPricing[] | undefined;
  isComputerInstancesFetching: boolean;
  ebsVolumes: ProductPricing[] | undefined;
  isEbsVolumesFetching: boolean;
  osImages: ProductPricing[] | undefined;
  isOsImagesFetching: boolean;
  bandwidths: ProductPricing[] | undefined;
  isBandwidthsFetching: boolean;
  floatingIps: ProductPricing[] | undefined;
  isFloatingIpsFetching: boolean;
  crossConnects: ProductPricing[] | undefined;
  isCrossConnectsFetching: boolean;
  onAddRequest: () => void;
  pricingRequests: PricingRequest[];
  onRemoveRequest: (index: number) => void;
  objectStorageProducts: ProductPricing[] | undefined;
  isObjectStorageProductsFetching: boolean;
  onAddObjectStorageRequest: () => void;
  objectStorageRequests: ObjectStorageRequest[];
  onRemoveObjectStorageRequest: (index: number) => void;
}

type ItemTab = "compute" | "storage";

const InvoiceItemsStep: React.FC<InvoiceItemsStepProps> = ({
  formData,
  errors,
  updateFormData,
  regions,
  isRegionsFetching,
  computerInstances,
  isComputerInstancesFetching,
  ebsVolumes,
  isEbsVolumesFetching,
  osImages,
  isOsImagesFetching,
  bandwidths,
  isBandwidthsFetching,
  floatingIps,
  isFloatingIpsFetching,
  crossConnects,
  isCrossConnectsFetching,
  onAddRequest,
  pricingRequests,
  onRemoveRequest,
  objectStorageProducts,
  isObjectStorageProductsFetching,
  onAddObjectStorageRequest,
  objectStorageRequests,
  onRemoveObjectStorageRequest,
}) => {
  const [activeTab, setActiveTab] = useState<ItemTab>("compute");

  const totalItems = pricingRequests.length + objectStorageRequests.length;

  const tabs: Array<{ id: ItemTab; label: string; icon: React.ComponentType<{ className?: string }>; count: number }> =
    useMemo(
      () => [
        { id: "compute", label: "Compute", icon: Cpu, count: pricingRequests.length },
        { id: "storage", label: "Object Storage", icon: Database, count: objectStorageRequests.length },
      ],
      [pricingRequests.length, objectStorageRequests.length],
    );

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {errors.general && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      {/* Two-column layout: builder on the left, sticky cart on the right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column: tabbed item builder */}
        <div className="space-y-4">
          {/* Tab strip */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                        isActive ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active builder */}
          {activeTab === "compute" ? (
            <ResourceItemBuilder
              formData={formData}
              errors={errors}
              updateFormData={updateFormData}
              regions={regions}
              isRegionsFetching={isRegionsFetching}
              computerInstances={computerInstances}
              isComputerInstancesFetching={isComputerInstancesFetching}
              osImages={osImages}
              isOsImagesFetching={isOsImagesFetching}
              ebsVolumes={ebsVolumes}
              isEbsVolumesFetching={isEbsVolumesFetching}
              bandwidths={bandwidths}
              isBandwidthsFetching={isBandwidthsFetching}
              floatingIps={floatingIps}
              isFloatingIpsFetching={isFloatingIpsFetching}
              crossConnects={crossConnects}
              isCrossConnectsFetching={isCrossConnectsFetching}
              onAddRequest={onAddRequest}
            />
          ) : (
            <StorageItemBuilder
              formData={formData}
              errors={errors}
              updateFormData={updateFormData}
              regions={regions}
              isRegionsFetching={isRegionsFetching}
              objectStorageProducts={objectStorageProducts}
              isObjectStorageProductsFetching={isObjectStorageProductsFetching}
              onAddObjectStorageRequest={onAddObjectStorageRequest}
            />
          )}
        </div>

        {/* Right column: sticky cart */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <ShoppingCart className="h-4 w-4 text-primary-600" />
              <h4 className="text-sm font-semibold">Invoice items</h4>
              <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-700">
                {totalItems}
              </span>
            </div>

            {totalItems === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
                Nothing added yet. Use the builder on the left to add compute or object storage items.
              </p>
            ) : (
              <div className="space-y-3">
                {pricingRequests.length > 0 && (
                  <InvoiceItemQueue
                    items={pricingRequests}
                    onRemove={onRemoveRequest}
                    type="compute"
                  />
                )}
                {objectStorageRequests.length > 0 && (
                  <InvoiceItemQueue
                    items={objectStorageRequests}
                    onRemove={onRemoveObjectStorageRequest}
                    type="storage"
                  />
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default InvoiceItemsStep;
