/**
 * Admin Calculator API
 */

import { apiClient } from "@/shared/api/client";
import type {
  CalculationResult,
  CalculatorFormData,
  PricingRate,
} from "@/shared/domains/calculators/types/calculator.types";

export const adminCalculatorApi = {
  calculate: async (calculatorData: CalculatorFormData): Promise<CalculationResult> => {
    const { data } = await apiClient.post<CalculationResult>("/admin/calculator", calculatorData);
    return data;
  },

  saveCalculation: async (calculation: CalculationResult): Promise<CalculationResult> => {
    const { data } = await apiClient.post<CalculationResult>("/admin/calculator/save", calculation);
    return data;
  },

  fetchPricingRates: async (region?: string): Promise<PricingRate[]> => {
    const { data } = await apiClient.get<PricingRate[]>("/admin/calculator/pricing-rates", {
      params: { region },
    });
    return data;
  },

  updatePricingRate: async (
    rateId: number,
    rateData: Partial<PricingRate>
  ): Promise<PricingRate> => {
    const { data } = await apiClient.put<PricingRate>(
      `/admin/calculator/pricing-rates/${rateId}`,
      rateData
    );
    return data;
  },

  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get("/admin/calculator/stats");
    return data;
  },
};

export default adminCalculatorApi;
