import React, { useState } from "react"; // Import useState
import { useFetchPricing } from "../../../hooks/pricingHooks";
import {
  useFetchBandwidths,
  useFetchComputerInstances,
  useFetchEbsVolumes,
  useFetchOsImages,
} from "../../../hooks/resource";
import AddPricing from "./addPricing";

const Pricing = () => {
  const [isAddPricingModalOpen, setIsAddPricingModalOpen] = useState(false);

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances();
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages();
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchBandwidths();
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();
  const { data: pricing, isFetching: isPricingFetching } = useFetchPricing();

  const openAddPricingModal = () => setIsAddPricingModalOpen(true);
  const closeAddPricingModal = () => setIsAddPricingModalOpen(false);

  return (
    <>
      <div className="flex justify-end mb-4">
        {" "}
        {/* Added a div for button placement */}
        <button
          onClick={openAddPricingModal}
          className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors flex items-center justify-center"
        >
          Add New Pricing
        </button>
      </div>

      <div className="">
        {/* table / cards for pricing will go here, but for now, lets leave it empty */}
        {isPricingFetching ? (
          <p className="text-gray-500">Loading pricing data...</p>
        ) : (
          <p className="text-gray-500">Pricing data will be displayed here.</p>
        )}
      </div>

      <AddPricing
        isOpen={isAddPricingModalOpen}
        onClose={closeAddPricingModal}
        computerInstances={computerInstances}
        isComputerInstancesFetching={isComputerInstancesFetching}
        osImages={osImages}
        isOsImagesFetching={isOsImagesFetching}
        bandwidths={bandwidths}
        isBandwidthsFetching={isBandwidthsFetching}
        ebsVolumes={ebsVolumes}
        isEbsVolumesFetching={isEbsVolumesFetching}
      />
    </>
  );
};

export default Pricing;
