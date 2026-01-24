// @ts-nocheck
import { useState } from "react";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchCalculatorOptions } from "../../hooks/adminHooks/calculatorOptionHooks";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import AdminPageShell from "../components/AdminPageShell.tsx";

const AdminCalculatorOptions = () => {
  const { data: regions, isFetching: isRegionsFetching } = useFetchRegions();
  const { data: options, isFetching: isOptionssFetching } = useFetchCalculatorOptions();

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell contentClassName="p-6 md:p-8"> </AdminPageShell>
    </>
  );
};
export default AdminCalculatorOptions;
