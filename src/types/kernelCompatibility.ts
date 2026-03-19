/**
 * Kernel Compatibility Types — Interfaces for AnyCloudFlow's kernel
 * compatibility check, preflight results, and compatibility matrix.
 */

// ─── Preflight ───────────────────────────────────────────────────

export interface PreflightCheckResult {
  passed: boolean;
  severity: "info" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
}

/** All 16 named preflight checks returned by the preflight endpoint. */
export interface PreflightResults {
  source_ssh?: PreflightCheckResult;
  target_ssh?: PreflightCheckResult;
  source_to_target?: PreflightCheckResult;
  disk_space?: PreflightCheckResult;
  transfer_tool?: PreflightCheckResult;
  os_detected?: PreflightCheckResult;
  kernel_compatibility?: PreflightCheckResult;
  arch_compatibility?: PreflightCheckResult;
  boot_compatibility?: PreflightCheckResult;
  boot_mode?: PreflightCheckResult;
  secure_boot?: PreflightCheckResult;
  kernel_modules?: PreflightCheckResult;
  security_framework?: PreflightCheckResult;
  cgroup_version?: PreflightCheckResult;
  network_naming?: PreflightCheckResult;
  filesystem_features?: PreflightCheckResult;
}

/** Names of checks that are critical (block migration). */
export const CRITICAL_CHECKS: (keyof PreflightResults)[] = [
  "source_ssh",
  "target_ssh",
  "source_to_target",
  "disk_space",
  "transfer_tool",
  "os_detected",
];

/** Names of checks that are warning-level (informational). */
export const WARNING_CHECKS: (keyof PreflightResults)[] = [
  "kernel_compatibility",
  "arch_compatibility",
  "boot_compatibility",
  "boot_mode",
  "secure_boot",
  "kernel_modules",
  "security_framework",
  "cgroup_version",
  "network_naming",
  "filesystem_features",
];

/** Human-readable labels for preflight check names. */
export const PREFLIGHT_CHECK_LABELS: Record<string, string> = {
  source_ssh: "Source SSH",
  target_ssh: "Target SSH",
  source_to_target: "Source → Target Connectivity",
  disk_space: "Disk Space",
  transfer_tool: "Transfer Tool",
  os_detected: "OS Detection",
  kernel_compatibility: "Kernel Compatibility",
  arch_compatibility: "Architecture Compatibility",
  boot_compatibility: "Boot Compatibility",
  boot_mode: "Boot Mode (UEFI/BIOS)",
  secure_boot: "Secure Boot",
  kernel_modules: "Kernel Modules",
  security_framework: "Security Framework",
  cgroup_version: "Cgroup Version",
  network_naming: "Network Naming",
  filesystem_features: "Filesystem Features",
};

// ─── Kernel Compatibility Check ──────────────────────────────────

export interface SystemProfile {
  kernel: string | null;
  arch: string | null;
  family: string | null;
  boot_mode: string | null;
  secure_boot: string | null;
  cgroup_version: string | null;
  security_framework: string | null;
  nic_naming: string | null;
}

export interface KernelCompatibilityResult {
  kernel_compatible: boolean;
  arch_compatible: boolean;
  severity: "info" | "warning" | "error";
  warnings: string[];
  source: SystemProfile;
  target: SystemProfile;
  initramfs_rebuild_needed: boolean;
  bootloader_check_needed: boolean;
  network_adaptation_needed: boolean;
  security_relabel_needed: boolean;
  cgroup_compat_needed: boolean;
  fs_features_compatible: boolean;
  fs_warnings: string[];
}

// ─── Migration Preflight Response ────────────────────────────────

export interface MigrationPreflightResponse {
  preflight_results: PreflightResults;
  source_kernel: string | null;
  target_kernel: string | null;
  source_arch: string | null;
  target_arch: string | null;
}

// ─── Compatibility Matrix ────────────────────────────────────────

export interface KernelCompatibilityMatrixEntry {
  id: number;
  source_family: string;
  target_family: string;
  min_source_kernel: string | null;
  max_source_kernel: string | null;
  min_target_kernel: string | null;
  max_target_kernel: string | null;
  arch_must_match: boolean;
  severity: "info" | "warning" | "error";
  notes: string | null;
}
