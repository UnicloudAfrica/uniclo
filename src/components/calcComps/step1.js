import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import {
  useFetchBandwidths,
  useFetchComputerInstances,
  useFetchEbsVolumes,
  useFetchOsImages,
  useFetchCrossConnect,
  useFetchFloatingIPs,
} from "../../hooks/resource";
import CoreConfiguration from "./components/CoreConfiguration";
import BlockStorage from "./components/BlockStorage";
import Networking from "./components/Networking";
import { useCreateQuote } from "../../hooks/adminHooks/quoteHooks";

const Step1Configuration = ({ handleNext }) => {
  const { mutate, isPending } = useCreateQuote();

  const [formData, setFormData] = useState({
    compute_instance_id: null,
    currency: "USD",
    os_image_id: null,
    months: 1,
    number_of_instances: 1,
    volumes: {}, // Reverted to object for multiple volumes or single selection
    floating_ip_id: null,
    floating_ip_count: 0,
    bandwidth_id: null,
    cross_connect_id: null,
  });

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances(formData.currency);
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages(
    formData.currency
  );
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchCrossConnect(formData.currency);
  const { data: floatingIps, isFetching: isFloatingIpsFetching } =
    useFetchFloatingIPs(formData.currency);
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchBandwidths(formData.currency);
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes(formData.currency);

  const [searchTerms, setSearchTerms] = useState({
    compute: "",
    os: "",
    storage: "",
    floatingIp: "",
    bandwidth: "",
    crossConnect: "",
  });

  const [showAllItems, setShowAllItems] = useState({
    compute: false,
    os: false,
    storage: false,
    floatingIp: false,
    bandwidth: false,
    crossConnect: false,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelect = (field, item) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] === item.id ? null : item.id,
    }));
  };

  const handleVolumeSelection = (volumeId) => {
    setFormData((prev) => {
      const newVolumes = {};
      if (!prev.volumes[volumeId]) {
        newVolumes[volumeId] = 30; // Default capacity when selected
      }
      return { ...prev, volumes: newVolumes };
    });
  };

  const handleVolumeCapacityChange = (volumeId, value) => {
    const capacity = parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      volumes: {
        ...prev.volumes,
        [volumeId]: capacity > 0 ? capacity : 1,
      },
    }));
  };

  const updateSearchTerm = (section, term) => {
    setSearchTerms((prev) => ({ ...prev, [section]: term }));
    if (term) {
      setShowAllItems((prev) => ({ ...prev, [section]: false }));
    }
  };

  const toggleShowAll = (section) => {
    setShowAllItems((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isFormValid = useMemo(() => {
    const isCoreConfigValid =
      formData.compute_instance_id &&
      formData.os_image_id &&
      formData.months > 0 &&
      formData.number_of_instances > 0;

    const isBlockStorageValid =
      Object.keys(formData.volumes).length > 0 &&
      Object.values(formData.volumes).every(
        (capacity) => capacity && capacity >= 30
      );

    return isCoreConfigValid && isBlockStorageValid;
  }, [formData]);

  const handleNextClick = () => {
    const volumesArray = Object.entries(formData.volumes).map(
      ([volumeId, capacity]) => ({
        ebs_volume_id: volumeId,
        capacity: capacity,
      })
    );

    const outputData = {
      compute_instance_id: formData.compute_instance_id,
      os_image_id: formData.os_image_id,
      months: formData.months,
      number_of_instances: formData.number_of_instances,
      volumes: volumesArray,
      floating_ip_id: formData.floating_ip_id,
      floating_ip_count: formData.floating_ip_count,
      bandwidth_id: formData.bandwidth_id,
      cross_connect_id: formData.cross_connect_id,
      currency: formData.currency,
    };

    handleNext(outputData);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 font-outfit">
      <div className="space-y-10">
        <CoreConfiguration
          formData={formData}
          searchTerms={searchTerms}
          showAllItems={showAllItems}
          computerInstances={computerInstances}
          osImages={osImages}
          isComputerInstancesFetching={isComputerInstancesFetching}
          isOsImagesFetching={isOsImagesFetching}
          handleInputChange={handleInputChange}
          handleSelect={handleSelect}
          updateSearchTerm={updateSearchTerm}
          toggleShowAll={toggleShowAll}
        />
        <BlockStorage
          formData={formData}
          searchTerms={searchTerms}
          showAllItems={showAllItems}
          ebsVolumes={ebsVolumes}
          isEbsVolumesFetching={isEbsVolumesFetching}
          handleVolumeSelection={handleVolumeSelection}
          handleVolumeCapacityChange={handleVolumeCapacityChange}
          updateSearchTerm={updateSearchTerm}
          toggleShowAll={toggleShowAll}
        />
        <Networking
          formData={formData}
          searchTerms={searchTerms}
          showAllItems={showAllItems}
          floatingIps={floatingIps}
          bandwidths={bandwidths}
          crossConnects={crossConnects}
          isFloatingIpsFetching={isFloatingIpsFetching}
          isBandwidthsFetching={isBandwidthsFetching}
          isCrossConnectsFetching={isCrossConnectsFetching}
          handleInputChange={handleInputChange}
          handleSelect={handleSelect}
          updateSearchTerm={updateSearchTerm}
          toggleShowAll={toggleShowAll}
        />
      </div>
      <div className="flex justify-end mt-8">
        <button
          onClick={handleNextClick}
          disabled={!isFormValid}
          className={`px-8 py-3 rounded-full text-white font-medium transition-colors duration-200 flex items-center justify-center ${
            isFormValid
              ? "bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8] hover:animate-pulse"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Review Configuration <ChevronRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Step1Configuration;
