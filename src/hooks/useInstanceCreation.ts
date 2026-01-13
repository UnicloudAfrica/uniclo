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
  project_mode: "existing",
  project_name: "",
  template_id: "",
  template_name: "",
  template_locked: false,
  network_preset: "standard",
  region: "",
  region_label: "",
  months: 12,
  compute_instance_id: "",
  compute_label: "",
  os_image_id: "",
  os_image_label: "",
  volume_type_id: "",
  volume_type_label: "",
  storage_size_gb: 50,
  bandwidth_id: "",
  bandwidth_count: 1,
  floating_ip_count: 0,
  security_group_ids: [],
  keypair_name: "",
  keypair_label: "",
  keypair_public_key: "",
  additional_volumes: [],
  network_id: "",
  subnet_id: "",
  subnet_label: "",
  tags: "",
  assignment_scope: "internal",
  member_user_ids: [],
});

export const useInstanceFormState = (initialConfigs: Configuration[] = [createConfiguration()]) => {
  const [configurations, setConfigurations] = useState<Configuration[]>(initialConfigs);

  const addConfiguration = useCallback(() => {
    setConfigurations((prev) => [...prev, createConfiguration()]);
  }, []);

  const addConfigurationWithPatch = useCallback((patch: Partial<Configuration>) => {
    const base = createConfiguration();
    const next = { ...base, ...patch, id: base.id };
    setConfigurations((prev) => [...prev, next]);
    return next.id;
  }, []);

  const resetConfigurationWithPatch = useCallback((id: string, patch: Partial<Configuration>) => {
    const base = createConfiguration();
    const next = { ...base, ...patch, id };
    setConfigurations((prev) => prev.map((c) => (c.id === id ? next : c)));
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
    addConfigurationWithPatch,
    resetConfigurationWithPatch,
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,
    createConfiguration, // Exported in case needed for reset
  };
};
