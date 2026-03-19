/**
 * PreflightResultsCard — Displays 16 preflight checks with pass/fail badges.
 *
 * Groups checks into critical (block migration) and warning (informational).
 * Each check shows status icon, label, severity, and expandable message.
 */
import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Shield,
} from "lucide-react";
import type { PreflightResults, PreflightCheckResult } from "@/types/kernelCompatibility";
import {
  CRITICAL_CHECKS,
  WARNING_CHECKS,
  PREFLIGHT_CHECK_LABELS,
} from "@/types/kernelCompatibility";

interface PreflightResultsCardProps {
  results: PreflightResults;
  className?: string;
}

const CheckRow: React.FC<{
  name: string;
  check: PreflightCheckResult;
}> = ({ name, check }) => {
  const [expanded, setExpanded] = useState(false);
  const label = PREFLIGHT_CHECK_LABELS[name] ?? name;

  const Icon = check.passed
    ? CheckCircle
    : check.severity === "error"
      ? XCircle
      : AlertTriangle;

  const iconColor = check.passed
    ? "text-green-500"
    : check.severity === "error"
      ? "text-red-500"
      : "text-yellow-500";

  return (
    <div className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <Icon size={16} className={`shrink-0 ${iconColor}`} />
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          check.passed
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : check.severity === "error"
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        }`}>
          {check.passed ? "Pass" : check.severity === "error" ? "Fail" : "Warning"}
        </span>
        {check.message ? (
          expanded ? <ChevronDown size={14} className="shrink-0 text-gray-400" /> : <ChevronRight size={14} className="shrink-0 text-gray-400" />
        ) : <div className="w-3.5" />}
      </button>
      {expanded && check.message && (
        <div className="px-4 pb-3 pl-11">
          <p className="text-xs text-gray-500 dark:text-gray-400">{check.message}</p>
        </div>
      )}
    </div>
  );
};

const PreflightResultsCard: React.FC<PreflightResultsCardProps> = ({
  results,
  className = "",
}) => {
  const criticalEntries = CRITICAL_CHECKS
    .filter((key) => results[key])
    .map((key) => ({ key, check: results[key]! }));

  const warningEntries = WARNING_CHECKS
    .filter((key) => results[key])
    .map((key) => ({ key, check: results[key]! }));

  const totalPassed = [...criticalEntries, ...warningEntries].filter(
    (e) => e.check.passed,
  ).length;
  const total = criticalEntries.length + warningEntries.length;

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Preflight Results
          </h3>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          totalPassed === total
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        }`}>
          {totalPassed}/{total} passed
        </span>
      </div>

      {criticalEntries.length > 0 && (
        <div>
          <div className="px-5 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Critical Checks
            </p>
          </div>
          {criticalEntries.map(({ key, check }) => (
            <CheckRow key={key} name={key} check={check} />
          ))}
        </div>
      )}

      {warningEntries.length > 0 && (
        <div>
          <div className="px-5 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Compatibility Checks
            </p>
          </div>
          {warningEntries.map(({ key, check }) => (
            <CheckRow key={key} name={key} check={check} />
          ))}
        </div>
      )}

      {total === 0 && (
        <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No preflight results available
        </div>
      )}
    </div>
  );
};

export default PreflightResultsCard;
