/**
 * Orbit primitive barrel export.
 *
 * Import everything you need from a single line:
 *
 *   import {
 *     HeroBanner, StoryStep, SuccessMoment,
 *     ResourceShell, ConfirmActionDialog, AsyncButton,
 *     StatusBadge, MoodIndicator, FriendlyTooltip,
 *     StateMachineProgress,
 *     usePrefersReducedMotion, RESILIENCE,
 *   } from "@/shared/components/orbit";
 *
 * IMPORTANT: also import "./orbit.css" once in your app entry (typically
 * `web/src/index.css`) so the keyframes are available globally.
 */

// ─── Wow primitives ──────────────────────────────────────────────────────────
export { HeroBanner } from "./HeroBanner";
export type { HeroBannerProps } from "./HeroBanner";

export { ResilienceHero, ResiliencePrimaryAction } from "./ResilienceHero";
export type { ResilienceHeroProps } from "./ResilienceHero";

export { getResilienceCopy, RESILIENCE_COPY } from "./resilienceCopy";
export type { ResilienceTopic, ResilienceCopyEntry } from "./resilienceCopy";

export { friendlyStatus } from "./statusMap";
export type { FriendlyStatus, StatusDomain } from "./statusMap";

export { StoryStep } from "./StoryStep";
export type { StoryStepProps } from "./StoryStep";

export { SuccessMoment } from "./SuccessMoment";
export type { SuccessMomentProps } from "./SuccessMoment";

export { FriendlyTooltip } from "./FriendlyTooltip";
export type { FriendlyTooltipProps } from "./FriendlyTooltip";

export { MoodIndicator } from "./MoodIndicator";
export type { MoodIndicatorProps, Mood } from "./MoodIndicator";

// ─── Workhorse primitives ────────────────────────────────────────────────────
export { StateMachineProgress } from "./StateMachineProgress";
export type {
  StateMachineProgressProps,
  PhaseDefinition,
  PhaseStatus,
} from "./StateMachineProgress";

export { ResourceShell } from "./ResourceShell";
export type { ResourceShellProps } from "./ResourceShell";

export { ConfirmActionDialog } from "./ConfirmActionDialog";
export type { ConfirmActionDialogProps } from "./ConfirmActionDialog";

export { AsyncButton } from "./AsyncButton";
export type { AsyncButtonProps, AsyncButtonVariant, AsyncButtonSize } from "./AsyncButton";

export { StatusBadge } from "./StatusBadge";
export type { StatusBadgeProps, StatusTone } from "./StatusBadge";

// ─── Motion utilities ────────────────────────────────────────────────────────
export {
  usePrefersReducedMotion,
  orbitTransition,
  orbitDuration,
  orbitIdleBounce,
  DURATION,
  EASING,
} from "./motion";

// ─── Brand re-export so consumers don't have to import from two places ──────
export { RESILIENCE, BRANDING } from "../../branding";
