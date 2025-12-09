import { useState, useCallback } from "react";
import { Configuration, AdditionalVolume } from "../types/InstanceConfiguration";

const genId = () => `cfg_${Math.random().toString(36).slice(2, 10)}`;

const createConfiguration = (): Configuration => ({
  id: genId(),
  launch_mode: "billable",
  name: "",
  instance_count: 1,
  description: "",
  project_id: "",
  region: "",
  months: 12,
  compute_instance_id: "",
  os_image_id: "",
  volume_type_id: "",
  storage_size_gb: 50,
  bandwidth_id: "",
  bandwidth_count: 1,
  floating_ip_count: 0,
  security_group_ids: [],
  keypair_name: "",
  keypair_label: "",
  additional_volumes: [],
  network_id: "",
  subnet_id: "",
  subnet_label: "",
  tags: "",
});

export const useInstanceFormState = (initialConfigs: Configuration[] = [createConfiguration()]) => {
  const [configurations, setConfigurations] = useState<Configuration[]>(initialConfigs);

  const addConfiguration = useCallback(() => {
    setConfigurations((prev) => [...prev, createConfiguration()]);
  }, []);

  const removeConfiguration = useCallback((id: string) => {
    setConfigurations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateConfiguration = useCallback((id: string, patch: Partial<Configuration>) => {
    setConfigurations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return { ...c, ...patch };
      })
    );
  }, []);

  const addAdditionalVolume = useCallback((configId: string) => {
    setConfigurations((prev) =>
      prev.map((c) => {
        if (c.id !== configId) return c;
        const newVol: AdditionalVolume = {
          id: genId(),
          volume_type_id: "",
          storage_size_gb: 10, // Default 10GB
        };
        return { ...c, additional_volumes: [...(c.additional_volumes || []), newVol] };
      })
    );
  }, []);

  const updateAdditionalVolume = useCallback(
    (configId: string, volumeId: string, patch: Partial<AdditionalVolume>) => {
      setConfigurations((prev) =>
        prev.map((c) => {
          if (c.id !== configId) return c;
          const newVols = (c.additional_volumes || []).map((v) =>
            v.id === volumeId ? { ...v, ...patch } : v
          );
          return { ...c, additional_volumes: newVols };
        })
      );
    },
    []
  );

  const removeAdditionalVolume = useCallback((configId: string, volumeId: string) => {
    setConfigurations((prev) =>
      prev.map((c) => {
        if (c.id !== configId) return c;
        return {
          ...c,
          additional_volumes: (c.additional_volumes || []).filter((v) => v.id !== volumeId),
        };
      })
    );
  }, []);

  return {
    configurations,
    setConfigurations,
    addConfiguration,
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,
    createConfiguration, // Exported in case needed for reset
  };
};
