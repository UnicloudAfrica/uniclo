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
export type { ButtonSize, ButtonVariant, CardPadding, CardVariant, ControlSize } from "./types";

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
export type { StatusTone } from "./StatusPill";
export { default as Pagination } from "./Pagination";
export { default as SearchBar } from "./SearchBar";

// Skeleton Loaders
export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, DashboardSkeleton } from "./Skeleton";

// Feedback Components
export { default as ConfirmDialog } from "./ConfirmDialog";

// Provider Components
export { default as ProviderBadge } from "./ProviderBadge";
export { getProviderLabel, getProviderShortLabel, getRegionOptionLabel } from "./ProviderBadge";

// ─────────────────────────────────────────────────────────────────
// Production primitives — whitelabel-aware via CSS variables.
// ─────────────────────────────────────────────────────────────────

// Layout / surface
export { default as SurfaceCard } from "./SurfaceCard";
export type {
  SurfaceCardProps,
  SurfaceVariant,
  SurfacePadding,
  SurfaceRadius,
} from "./SurfaceCard";

// Typography
export { default as Eyebrow } from "./Eyebrow";
export type { EyebrowSize, EyebrowTone } from "./Eyebrow";
export { default as SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

// Progress indicators
export { default as Gauge } from "./Gauge";
export type { GaugeTone, GaugeSize } from "./Gauge";
export { default as ProgressBar } from "./ProgressBar";
export type { ProgressBarTone } from "./ProgressBar";

// Stat / KPI tiles
export { default as StatTile } from "./StatTile";
export type { StatTileProps, StatTileTone } from "./StatTile";
export { default as KpiTile } from "./KpiTile";
export type { KpiTileProps, KpiTileTone } from "./KpiTile";
export { default as IconTile } from "./IconTile";
export type { IconTileTone, IconTileSize } from "./IconTile";

// Feedback states
export { default as InfoCallout } from "./InfoCallout";
export type { InfoCalloutProps, InfoCalloutTone } from "./InfoCallout";
export { default as LoadingState } from "./LoadingState";
export type { LoadingStateProps } from "./LoadingState";
export { default as ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

// Overlays + identity
export { default as Tooltip } from "./Tooltip";
export type { TooltipProps, TooltipPlacement } from "./Tooltip";
export { default as DropdownMenu } from "./DropdownMenu";
export type { DropdownMenuProps, DropdownMenuItem } from "./DropdownMenu";
export { default as Tabs } from "./Tabs";
export type { TabsProps, TabItem } from "./Tabs";
export { default as Avatar } from "./Avatar";
export type { AvatarProps, AvatarSize, AvatarShape } from "./Avatar";
export { default as Breadcrumbs } from "./Breadcrumbs";
export type { BreadcrumbsProps, BreadcrumbItem } from "./Breadcrumbs";
export { default as Chip } from "./Chip";
export type { ChipProps, ChipTone, ChipSize } from "./Chip";
export { default as DescriptionList } from "./DescriptionList";
export type { DescriptionListProps, DescriptionListItem } from "./DescriptionList";

// i18n-readiness — drop-in target for react-i18next adoption
export {
  UiMessagesProvider,
  useUiMessages,
  DEFAULT_UI_MESSAGES,
} from "./messages";
export type { UiMessages } from "./messages";
