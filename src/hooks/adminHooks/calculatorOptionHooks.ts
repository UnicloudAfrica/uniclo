import { useSharedCalculatorOptions, useSharedMultiQuotes } from "../sharedCalculatorHooks";

// Use shared calculator options hook instead of admin-specific one
export const useFetchCalculatorOptions = ({ tenantId, region }: any = {}, options: any = {}) => {
  return useSharedCalculatorOptions({ tenantId, region }, options);
};

// Use shared multi-quotes hook instead of admin-specific one
export const useCreateMultiQuotes = () => {
  return useSharedMultiQuotes();
};
