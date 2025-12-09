/**
 * Calculator Helper Utilities
 */

import type {
  CalculationResult,
  InstanceCalculation,
  StorageCalculation,
} from "../types/calculator.types";

export const calculateInstanceMonthlyCost = (
  instanceType: string,
  quantity: number,
  hoursPerMonth: number,
  unitPrice: number
): number => {
  return quantity * hoursPerMonth * unitPrice;
};

export const calculateStorageMonthlyCost = (sizeGB: number, pricePerGB: number): number => {
  return sizeGB * pricePerGB;
};

export const calculateNetworkCost = (bandwidthGB: number, pricePerGB: number): number => {
  return bandwidthGB * pricePerGB;
};

export const calculateSubtotal = (result: CalculationResult): number => {
  return (result.instance_cost || 0) + (result.storage_cost || 0) + (result.network_cost || 0);
};

export const applyDiscount = (amount: number, discountPercent: number): number => {
  return amount * (discountPercent / 100);
};

export const applyTax = (amount: number, taxPercent: number): number => {
  return amount * (taxPercent / 100);
};

export const calculateTotal = (result: CalculationResult): number => {
  const subtotal = calculateSubtotal(result);
  const discount = result.discount_amount || 0;
  const tax = result.tax_amount || 0;
  return subtotal - discount + tax;
};

export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
};

export const formatPricePerUnit = (
  price: number,
  unit: string,
  currency: string = "USD"
): string => {
  const formatted = formatCurrency(price, currency);
  return `${formatted}/${unit}`;
};

export const estimateAnnualCost = (monthlyCost: number): number => {
  return monthlyCost * 12;
};
