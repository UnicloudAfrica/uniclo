import { LucideIcon } from "lucide-react";

export interface Option {
  value: string | number;
  label: string;
}

export interface FieldConfig {
  stateKey?: string;
  label?: string;
  placeholder?: string;
  type?: "text" | "number" | "select" | "textarea" | "toggle" | "description" | "password";
  icon?: LucideIcon;
  required?: boolean;
  readOnly?: boolean;
  help?: string;
  options?: Option[];
  rows?: number;
  includeWhenUndefined?: boolean;
  cast?: (value: any) => any;
}

export interface GroupConfig {
  title: string;
  description: string;
  layout?: "grid" | "default";
  fields: FieldConfig[];
}

export interface TabConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  categories: string[];
  groups: GroupConfig[];
}
