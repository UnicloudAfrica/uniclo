/**
 * Shared UI Components
 *
 * These components are shared across Admin, Tenant, and Client dashboards.
 * They are pure UI components with no API dependencies.
 *
 * Usage:
 * import { ModernButton, ModernCard, ModernInput } from '@/shared/components/ui';
 */

// Core UI Primitives
export { default as ModernButton } from "./ModernButton";
export type { ModernButtonProps } from "./ModernButton";

export { default as ModernCard } from "./ModernCard";
export type { ModernCardProps } from "./ModernCard";

export { default as ModernInput } from "./ModernInput";
export { ResourceSection } from "./ResourceSection";
export { ResourceEmptyState } from "./ResourceEmptyState";
export { ResourceListCard } from "./ResourceListCard";
export { default as ModernSelect } from "./ModernSelect";
export { default as SearchableSelect } from "./SearchableSelect";
export { default as ModernModal } from "./ModernModal";
export { default as ModernTextarea } from "./ModernTextarea";
export { default as SelectableInput } from "./SelectableInput";

// Resource Components
export { default as ResourceHero } from "./ResourceHero";

// Platform Components
export { default as ModernTable } from "./ModernTable";
export type { Column } from "./ModernTable";
export { default as PaymentModal } from "./PaymentModal";

// Data Display Components
export { default as ModernStatsCard } from "./ModernStatsCard";
export { default as StatusPill } from "./StatusPill";
export { default as Pagination } from "./Pagination";
export { default as SearchBar } from "./SearchBar";
