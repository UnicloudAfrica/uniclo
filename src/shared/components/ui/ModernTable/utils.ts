import type { ReactNode } from "react";
import { designTokens } from "@/styles/designTokens";
import type { ActionToneStyles, Column, TableRowBase } from "./types";

/** Extract a fontSize string from the design tokens tuple. */
export const getFontSize = (key: keyof typeof designTokens.typography.fontSize): string => {
  const value = designTokens.typography.fontSize[key];
  return value[0] as string;
};

/** Safely access a colour shade from a design token palette. */
type TokenColorKey = Exclude<keyof typeof designTokens.colors, "surface">;
export const getColor = (color: TokenColorKey, shade: number | string): string => {
  const palette = designTokens.colors[color] as Record<string, string>;
  const shadeKey = shade as keyof typeof palette;
  return palette[shadeKey] ?? "";
};

/** Read an arbitrary property from a row object. */
export const getRowValue = <T extends TableRowBase>(row: T, key: string): unknown => {
  const record = row as Record<string, unknown>;
  return record[key];
};

/** Format an unknown cell value into a displayable ReactNode. */
export const formatCellValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toLocaleString();
  return String(value);
};

/** Get inline style tones for action buttons. */
export const getActionToneStyles = (
  tone: "primary" | "danger" | "success" | "neutral" = "neutral"
): ActionToneStyles => {
  const { neutral, primary, error, success } = designTokens.colors;
  const tones: Record<string, ActionToneStyles> = {
    primary: {
      color: primary[700],
      bg: primary[50],
      border: primary[200],
      hoverBg: primary[100],
      hoverBorder: primary[300],
      shadow: "0 6px 14px -10px rgb(var(--theme-color-rgb) / 0.45)",
    },
    danger: {
      color: error[700],
      bg: error[50],
      border: error[200],
      hoverBg: error[100],
      hoverBorder: error[200],
      shadow: "0 6px 14px -10px rgb(var(--theme-danger-500) / 0.45)",
    },
    success: {
      color: success[700],
      bg: success[50],
      border: success[200],
      hoverBg: success[100],
      hoverBorder: success[200],
      shadow: "0 6px 14px -10px rgb(var(--theme-success-500) / 0.45)",
    },
    neutral: {
      color: neutral[700],
      bg: neutral[50],
      border: neutral[200],
      hoverBg: neutral[100],
      hoverBorder: neutral[300],
      shadow: "0 4px 10px -8px rgb(var(--theme-neutral-900) / 0.25)",
    },
  };
  return tones[tone] || tones.neutral;
};

/** Trigger a CSV download of the table data. */
export const exportToCsv = <T extends TableRowBase>(
  title: string,
  columns: Column<T>[],
  sortedData: T[]
): void => {
  const csvContent = [
    columns.map((col) => (typeof col.header === "string" ? col.header : col.key)).join(","),
    ...sortedData.map((row: T) =>
      columns
        .map((col) => {
          const value = getRowValue(row, col.key);
          return value === null || value === undefined ? "" : String(value);
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = globalThis.window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "data"}.csv`;
  a.click();
  globalThis.window.URL.revokeObjectURL(url);
};
