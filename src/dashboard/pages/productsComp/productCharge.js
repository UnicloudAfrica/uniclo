import React, { useState } from "react";
import {
  useFetchBandwidths,
  useFetchChargeOptions,
  useFetchComputerInstances,
  useFetchEbsVolumes,
  useFetchOsImages,
} from "../../../hooks/resource";
import AddProductCharge from "./addProductCharge";
import { useFetchProductCharge } from "../../../hooks/pricingHooks";

const ProductCharge = () => {
  const [isAddProductChargeModalOpen, setIsAddProductChargeModalOpen] =
    useState(false);

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances();
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages();
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchBandwidths();
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();
  const { data: productCharge, isFetching: isProductChargeFetching } =
    useFetchProductCharge();
  const { data: chargeOptions, isFetching: isChargeOptionsFetching } =
    useFetchChargeOptions();

  const openAddProductChargeModal = () => setIsAddProductChargeModalOpen(true);
  const closeAddProductChargeModal = () =>
    setIsAddProductChargeModalOpen(false);

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={openAddProductChargeModal}
          className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors flex items-center justify-center"
        >
          Add New Product Charge
        </button>
      </div>

      <div className="">
        {/* Table/cards for product charges will go here */}
        <p className="text-gray-500">
          Product charge data will be displayed here.
        </p>
      </div>

      <AddProductCharge
        isOpen={isAddProductChargeModalOpen}
        onClose={closeAddProductChargeModal}
        computerInstances={computerInstances}
        isComputerInstancesFetching={isComputerInstancesFetching}
        osImages={osImages}
        isOsImagesFetching={isOsImagesFetching}
        bandwidths={bandwidths}
        isBandwidthsFetching={isBandwidthsFetching}
        ebsVolumes={ebsVolumes}
        isEbsVolumesFetching={isEbsVolumesFetching}
        chargeOptions={chargeOptions}
        isChargeOptionsFetching={isChargeOptionsFetching}
      />
    </>
  );
};

export default ProductCharge;
