import React from "react";
import ObjectStoragePlanSelector from "./ObjectStoragePlanSelector";

/**
 * Lightweight, reusable layout for Silo Storage plan selection.
 * Wrap this inside the persona-specific shell (AdminPageShell, TenantPageShell, ClientPageShell, etc.).
 */
const ObjectStorageCreateLayout = ({
  title,
  description,
  persona = "client",
  enableFastTrack = false,
  onBack,
  onStandardPlan,
  onFastTrack,
  children,
}) => {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description ? (
          typeof description === "string" ? (
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          ) : (
            <div className="mt-2 text-sm text-gray-600">{description}</div>
          )
        ) : null}
      </div>

      <ObjectStoragePlanSelector
        mode="standard"
        onModeChange={() => {}}
        onBack={onBack}
        enableFastTrack={enableFastTrack}
        onStandardPlan={onStandardPlan}
        onFastTrack={onFastTrack}
        standardDescription="Proceed with the standard Silo Storage provisioning flow."
        fastTrackDescription="Skip to provisioning for approved Silo Storage exceptions."
      />

      {children}
    </section>
  );
};

export default ObjectStorageCreateLayout;
