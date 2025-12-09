/**
 * Tax Helper Utilities
 */

import type { TaxRule, TaxCalculation, TaxStatus } from "../types/tax.types";

export const getTaxStatusVariant = (status: TaxStatus) => {
  return status === "active"
    ? { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" }
    : { label: "Inactive", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
};

export const calculateTax = (subtotal: number, taxRules: TaxRule[]): TaxCalculation => {
  const applicableRules = taxRules.filter(
    (rule) =>
      rule.status === "active" &&
      new Date(rule.effective_from) <= new Date() &&
      (!rule.effective_until || new Date(rule.effective_until) >= new Date())
  );

  const taxDetails = applicableRules.map((rule) => ({
    rule_id: rule.id,
    rule_name: rule.name,
    rate: rule.rate,
    amount: subtotal * (rule.rate / 100),
  }));

  const total_tax = taxDetails.reduce((sum, tax) => sum + tax.amount, 0);

  return {
    subtotal,
    tax_rules: taxDetails,
    total_tax,
    total: subtotal + total_tax,
  };
};

export const formatTaxRate = (rate: number): string => {
  return `${rate.toFixed(2)}%`;
};

export const getTaxRulesByCountry = (rules: TaxRule[], country: string): TaxRule[] => {
  return rules.filter((rule) => rule.country === country && rule.status === "active");
};

export const isRuleEffective = (rule: TaxRule): boolean => {
  const now = new Date();
  const from = new Date(rule.effective_from);
  const until = rule.effective_until ? new Date(rule.effective_until) : null;

  return from <= now && (!until || until >= now);
};
