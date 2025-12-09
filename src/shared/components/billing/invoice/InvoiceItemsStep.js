import React from "react";
import ResourceItemBuilder from "./ResourceItemBuilder";
import StorageItemBuilder from "./StorageItemBuilder";
import InvoiceItemQueue from "./InvoiceItemQueue";

const InvoiceItemsStep = ({
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
