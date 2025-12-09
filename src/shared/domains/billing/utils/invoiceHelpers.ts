/**
 * Billing/Invoice Helper Utilities
 */

import type { Invoice, InvoiceStatus, InvoiceStats, InvoiceLineItem } from "../types/invoice.types";

export const getInvoiceStatusVariant = (status: InvoiceStatus) => {
  switch (status) {
    case "draft":
      return { label: "Draft", bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
    case "pending":
      return { label: "Pending", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
    case "sent":
      return { label: "Sent", bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" };
    case "paid":
      return {
        label: "Paid",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "overdue":
      return { label: "Overdue", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    case "cancelled":
      return { label: "Cancelled", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
    case "refunded":
      return {
        label: "Refunded",
        bg: "bg-purple-50",
        text: "text-purple-700",
        dot: "bg-purple-500",
      };
    default:
      return { label: "Unknown", bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" };
  }
};

export const calculateLineItemTotal = (item: InvoiceLineItem): number => {
  const subtotal = item.quantity * item.unit_price;
  const afterDiscount = subtotal - (item.discount || 0);
  const tax = afterDiscount * ((item.tax_rate || 0) / 100);
  return afterDiscount + tax;
};

export const calculateInvoiceTotals = (
  lineItems: InvoiceLineItem[],
  discountAmount: number = 0
) => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxAmount = lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    return sum + itemSubtotal * ((item.tax_rate || 0) / 100);
  }, 0);
  const total = subtotal + taxAmount - discountAmount;

  return { subtotal, taxAmount, total };
};

export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
};

export const isOverdue = (invoice: Invoice): boolean => {
  if (invoice.status === "paid" || invoice.status === "cancelled") return false;
  return new Date(invoice.due_date) < new Date();
};

export const daysUntilDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const calculateInvoiceStats = (invoices: Invoice[]): InvoiceStats => {
  return invoices.reduce(
    (stats, inv) => {
      stats.total++;
      stats.total_amount += inv.total_amount;

      if (inv.status === "paid") {
        stats.paid++;
        stats.paid_amount += inv.total_amount;
      } else if (inv.status === "overdue") {
        stats.overdue++;
        stats.outstanding_amount += inv.amount_due || inv.total_amount;
      } else if (inv.status === "sent") {
        stats.sent++;
        stats.outstanding_amount += inv.amount_due || inv.total_amount;
      } else if (inv.status === "draft") {
        stats.draft++;
      }

      return stats;
    },
    {
      total: 0,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      total_amount: 0,
      paid_amount: 0,
      outstanding_amount: 0,
    }
  );
};

export const generateInvoiceNumber = (count: number, prefix: string = "INV"): string => {
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${num}`;
};

export const filterInvoicesBySearch = (invoices: Invoice[], query: string): Invoice[] => {
  if (!query.trim()) return invoices;
  const q = query.toLowerCase();
  return invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.client_name.toLowerCase().includes(q) ||
      inv.client_email.toLowerCase().includes(q)
  );
};
