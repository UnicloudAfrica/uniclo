import React from "react";
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
  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errors.general && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      {/* Stacked layout - Resource Item Builder on top */}
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

      {/* Storage Item Builder below */}
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

      {/* Item Queues */}
      {pricingRequests.length > 0 && (
        <InvoiceItemQueue items={pricingRequests} onRemove={onRemoveRequest} type="compute" />
      )}

      {objectStorageRequests.length > 0 && (
        <InvoiceItemQueue
          items={objectStorageRequests}
          onRemove={onRemoveObjectStorageRequest}
          type="storage"
        />
      )}
    </div>
  );
};

export default InvoiceItemsStep;
