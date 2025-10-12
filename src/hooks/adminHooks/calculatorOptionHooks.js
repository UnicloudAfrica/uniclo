import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";
import { useSharedCalculatorOptions, useSharedMultiQuotes } from "../sharedCalculatorHooks";

// Use shared calculator options hook instead of admin-specific one
export const useFetchCalculatorOptions = (
  { tenantId, region } = {},
  options = {}
) => {
  return useSharedCalculatorOptions({ tenantId, region }, options);
};

// Use shared multi-quotes hook instead of admin-specific one
export const useCreateMultiQuotes = () => {
  return useSharedMultiQuotes();
};
