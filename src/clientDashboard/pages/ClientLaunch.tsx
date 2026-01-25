// @ts-nocheck
import React from "react";
import ClientActiveTab from "../components/clientActiveTab";
import LaunchSideMenu from "./launchComps/LaunchSideMenu";
import ClientPageShell from "../components/ClientPageShell";

export default function ClientLaunch() {
  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Launch Center"
        description="Configure and orchestrate your provisioning workflow."
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Launch" }]}
        contentWrapper="div"
      >
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <LaunchSideMenu />
          <div className="flex-1 rounded-lg bg-white p-4 shadow-sm lg:w-[76%] lg:p-6">
            {/* active component goes here */}
          </div>
        </div>
      </ClientPageShell>
    </>
  );
}
