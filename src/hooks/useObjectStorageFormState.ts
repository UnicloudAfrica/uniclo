import React, { useState, useCallback } from "react";
import { ServiceProfile, createServiceProfile } from "./objectStorageUtils";

export interface UseObjectStorageFormStateReturn {
  serviceProfiles: ServiceProfile[];
  addProfile: () => void;
  removeProfile: (profileId: string) => void;
  updateProfile: (profileId: string, updates: Partial<ServiceProfile>) => void;
  handleRegionChange: (profileId: string, region: string) => void;
  handleTierChange: (profileId: string, tierKey: string) => void;
  handleMonthsChange: (profileId: string, months: string) => void;
  handleStorageGbChange: (profileId: string, storageGb: string) => void;
  handleNameChange: (profileId: string, name: string) => void;
  handleUnitPriceChange: (profileId: string, unitPrice: string) => void;
  resetProfiles: () => void;
  setServiceProfiles: React.Dispatch<React.SetStateAction<ServiceProfile[]>>;
}

export const useObjectStorageFormState = (): UseObjectStorageFormStateReturn => {
  const [serviceProfiles, setServiceProfiles] = useState<ServiceProfile[]>([
    createServiceProfile(),
  ]);

  const addProfile = useCallback(() => {
    setServiceProfiles((prev) => {
      if (prev.length >= 10) {
        return prev; // Max 10 profiles
      }
      return [...prev, createServiceProfile()];
    });
  }, []);

  const removeProfile = useCallback((profileId: string) => {
    setServiceProfiles((prev) => {
      if (prev.length <= 1) {
        return prev; // Keep at least one profile
      }
      return prev.filter((p) => p.id !== profileId);
    });
  }, []);

  const updateProfile = useCallback((profileId: string, updates: Partial<ServiceProfile>) => {
    setServiceProfiles((prev) =>
      prev.map((profile) => (profile.id === profileId ? { ...profile, ...updates } : profile))
    );
  }, []);

  const handleRegionChange = useCallback(
    (profileId: string, region: string) => {
      updateProfile(profileId, { region, tierKey: "" }); // Reset tier when region changes
    },
    [updateProfile]
  );

  const handleTierChange = useCallback(
    (profileId: string, tierKey: string) => {
      updateProfile(profileId, { tierKey });
    },
    [updateProfile]
  );

  const handleMonthsChange = useCallback(
    (profileId: string, months: string) => {
      updateProfile(profileId, { months });
    },
    [updateProfile]
  );

  const handleStorageGbChange = useCallback(
    (profileId: string, storageGb: string) => {
      updateProfile(profileId, { storageGb });
    },
    [updateProfile]
  );

  const handleNameChange = useCallback(
    (profileId: string, name: string) => {
      updateProfile(profileId, { name });
    },
    [updateProfile]
  );

  const handleUnitPriceChange = useCallback(
    (profileId: string, unitPrice: string) => {
      updateProfile(profileId, { unitPriceOverride: unitPrice });
    },
    [updateProfile]
  );

  const resetProfiles = useCallback(() => {
    setServiceProfiles([createServiceProfile()]);
  }, []);

  return {
    serviceProfiles,
    addProfile,
    removeProfile,
    updateProfile,
    handleRegionChange,
    handleTierChange,
    handleMonthsChange,
    handleStorageGbChange,
    handleNameChange,
    handleUnitPriceChange,
    resetProfiles,
    setServiceProfiles,
  };
};
