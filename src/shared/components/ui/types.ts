/**
 * Shared UI primitive contracts.
 * Keep these types narrow so all primitives expose a consistent API.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "outlineDanger"
  | "ghost"
  | "danger"
  | "success";

export type ButtonSize = "xs" | "sm" | "base" | "md" | "lg" | "xl";

export type ControlSize = "sm" | "md" | "lg";

export type CardVariant = "default" | "elevated" | "outlined" | "filled" | "glass";

export type CardPadding = "default" | "none" | "sm" | "lg" | "xl";
