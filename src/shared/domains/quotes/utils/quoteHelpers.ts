/**
 * Quote Helper Utilities
 */

import type { Quote, QuoteStatus, QuoteStats, QuoteValidityPeriod } from "../types/quote.types";

export const getQuoteStatusVariant = (status: QuoteStatus) => {
  switch (status) {
    case "draft":
      return { label: "Draft", bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
    case "sent":
      return { label: "Sent", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
    case "viewed":
      return { label: "Viewed", bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" };
    case "accepted":
      return {
        label: "Accepted",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "declined":
      return { label: "Declined", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    case "expired":
      return {
        label: "Expired",
        bg: "bg-orange-50",
        text: "text-orange-700",
        dot: "bg-orange-500",
      };
    default:
      return { label: "Unknown", bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" };
  }
};

export const getValidityDays = (period: QuoteValidityPeriod): number => {
  const map: Record<QuoteValidityPeriod, number> = {
    "7_days": 7,
    "14_days": 14,
    "30_days": 30,
    "60_days": 60,
    "90_days": 90,
  };
  return map[period] || 30;
};

export const calculateValidUntil = (issueDate: string, period: QuoteValidityPeriod): string => {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + getValidityDays(period));
  return date.toISOString().split("T")[0];
};

export const isExpired = (quote: Quote): boolean => {
  if (quote.status === "accepted" || quote.status === "declined") return false;
  return new Date(quote.valid_until) < new Date();
};

export const daysUntilExpiry = (validUntil: string): number => {
  const expiry = new Date(validUntil);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const calculateQuoteStats = (quotes: Quote[]): QuoteStats => {
  const stats = quotes.reduce(
    (acc, quote) => {
      acc.total++;
      acc.total_value += quote.total_amount;

      switch (quote.status) {
        case "draft":
          acc.draft++;
          break;
        case "sent":
          acc.sent++;
          break;
        case "accepted":
          acc.accepted++;
          break;
        case "declined":
          acc.declined++;
          break;
        case "expired":
          acc.expired++;
          break;
      }

      return acc;
    },
    {
      total: 0,
      draft: 0,
      sent: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      total_value: 0,
      conversion_rate: 0,
    }
  );

  const closed = stats.accepted + stats.declined;
  stats.conversion_rate = closed > 0 ? (stats.accepted / closed) * 100 : 0;

  return stats;
};

export const generateQuoteNumber = (count: number, prefix: string = "QUO"): string => {
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${num}`;
};

export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
};
