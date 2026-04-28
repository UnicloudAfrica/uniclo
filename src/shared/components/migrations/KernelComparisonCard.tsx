/**
 * KernelComparisonCard — Side-by-side kernel/OS comparison for migrations.
 *
 * Shows source vs target: OS family, kernel version, architecture.
 * Displays compatibility verdict and adaptation warnings.
 */
import React from "react";
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Cpu,
} from "lucide-react";
import type { KernelCompatibilityResult } from "@/types/kernelCompatibility";

interface KernelComparisonCardProps {
  result: KernelCompatibilityResult;
  className?: string;
}

const ProfileColumn: React.FC<{
  label: string;
  kernel: string | null;
  arch: string | null;
  family: string | null;
  bootMode: string | null;
  secureBoot: string | null;
  securityFramework: string | null;
}> = ({ label, kernel, arch, family, bootMode, secureBoot, securityFramework }) => (
  <div className="flex-1 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <div className="space-y-1.5">
      {family && (
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">OS: </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{family}</span>
        </div>
      )}
      <div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Kernel: </span>
        <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
          {kernel ?? "Unknown"}
        </span>
      </div>
      <div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Arch: </span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {arch ?? "Unknown"}
        </span>
      </div>
      {bootMode && (
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Boot: </span>
          <span className="text-sm text-gray-900 dark:text-gray-100">{bootMode}</span>
          {secureBoot && <span className="ml-1 text-xs text-gray-500">({secureBoot})</span>}
        </div>
      )}
      {securityFramework && (
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Security: </span>
          <span className="text-sm text-gray-900 dark:text-gray-100">{securityFramework}</span>
        </div>
      )}
    </div>
  </div>
);

const KernelComparisonCard: React.FC<KernelComparisonCardProps> = ({
  result,
  className = "",
}) => {
  const VerdictIcon =
    result.severity === "error"
      ? XCircle
      : result.severity === "warning"
        ? AlertTriangle
        : CheckCircle;

  const _verdictColor =
    result.severity === "error"
      ? "text-red-500"
      : result.severity === "warning"
        ? "text-yellow-500"
        : "text-green-500";

  const verdictBg =
    result.severity === "error"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : result.severity === "warning"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

  const verdictLabel =
    result.severity === "error"
      ? "Incompatible"
      : result.severity === "warning"
        ? "Compatible with warnings"
        : "Fully compatible";

  const adaptations: string[] = [];
  if (result.initramfs_rebuild_needed) { adaptations.push("Initramfs rebuild needed"); }
  if (result.bootloader_check_needed) { adaptations.push("Bootloader reconfiguration needed"); }
  if (result.network_adaptation_needed) { adaptations.push("Network interface adaptation needed"); }
  if (result.security_relabel_needed) { adaptations.push("Security framework relabel needed"); }
  if (result.cgroup_compat_needed) { adaptations.push("Cgroup compatibility fix needed"); }
  if (!result.fs_features_compatible) { adaptations.push("Filesystem feature mismatch"); }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            OS & Kernel Comparison
          </h3>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${verdictBg}`}>
          <VerdictIcon size={12} />
          {verdictLabel}
        </span>
      </div>

      <div className="p-5">
        {/* Side-by-side profiles */}
        <div className="flex items-center gap-3">
          <ProfileColumn
            label="Source"
            kernel={result.source.kernel}
            arch={result.source.arch}
            family={result.source.family}
            bootMode={result.source.boot_mode}
            secureBoot={result.source.secure_boot}
            securityFramework={result.source.security_framework}
          />
          <ArrowRight size={20} className="shrink-0 text-gray-300 dark:text-gray-600" />
          <ProfileColumn
            label="Target"
            kernel={result.target.kernel}
            arch={result.target.arch}
            family={result.target.family}
            bootMode={result.target.boot_mode}
            secureBoot={result.target.secure_boot}
            securityFramework={result.target.security_framework}
          />
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950/30">
            <p className="mb-1 text-xs font-semibold text-yellow-800 dark:text-yellow-300">
              Warnings
            </p>
            <ul className="space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Filesystem warnings */}
        {result.fs_warnings.length > 0 && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/30">
            <p className="mb-1 text-xs font-semibold text-orange-800 dark:text-orange-300">
              Filesystem Warnings
            </p>
            <ul className="space-y-1">
              {result.fs_warnings.map((w, i) => (
                <li key={i} className="text-xs text-orange-700 dark:text-orange-400">{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Adaptations needed */}
        {adaptations.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Post-Migration Adaptations
            </p>
            <div className="flex flex-wrap gap-2">
              {adaptations.map((a, i) => (
                <span
                  key={i}
                  className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KernelComparisonCard;
