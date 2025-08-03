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

const Step1Configuration = ({ handleNext }) => {
  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances();
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages();
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchCrossConnect();
  const { data: floatingIps, isFetching: isFloatingIpsFetching } =
    useFetchFloatingIPs();
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchBandwidths();
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();

  const [formData, setFormData] = useState({
    compute_instance_id: null,
    os_image_id: null,
    months: 1,
    number_of_instances: 1,
    volumes: {},
    floating_ip_id: null,
    floating_ip_count: 0,
    bandwidth_id: null,
    cross_connect_id: null,
  });

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
    setFormData((prev) => ({
      ...prev,
      volumes: prev.volumes[volumeId] ? {} : { [volumeId]: 30 },
    }));
  };

  const handleVolumeCapacityChange = (volumeId, value) => {
    const capacity = parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      volumes: { [volumeId]: capacity > 0 ? capacity : 1 },
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
    return (
      formData.compute_instance_id &&
      formData.os_image_id &&
      formData.months > 0 &&
      formData.number_of_instances > 0
    );
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
