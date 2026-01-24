// @ts-nocheck
import React, { useState } from "react";
import AdminActiveTab from "../components/adminActiveTab";
import NetworkSideMenu from "../components/infraSideMenu";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import AdminPageShell from "../components/AdminPageShell.tsx";

export default function AdminKeyPairs() {
  const { data: keyPairs, isFetching: isKeyPairsFetching } = useFetchKeyPairs();

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell
        title="Key Pairs"
        description="Manage SSH key pairs for secure infrastructure access."
        contentClassName="flex flex-col lg:flex-row gap-6"
      >
        <NetworkSideMenu />

        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6">AdminInfra</div>
      </AdminPageShell>
    </>
  );
}
