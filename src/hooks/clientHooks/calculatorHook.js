// src/hooks/clientHooks/calculatorHook.js
import { useMutation } from "@tanstack/react-query";
import clientApi from "../../index/client/api";

const calculatePricing = async (pricingData) => {
  const res = await clientApi("POST", "/calculator/pricing", pricingData);
  if (!res.data) {
    throw new Error(res.message || "Failed to calculate pricing");
  }
  return res.data;
};

export const useClientCalculatePricing = (options = {}) => {
  return useMutation({
    mutationFn: calculatePricing,
    ...options,
  });
};
