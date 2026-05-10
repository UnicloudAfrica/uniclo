import React, { useState } from "react";
import {
  useFetchAgentRules,
  useFetchAgentDecisions,
  useToggleAgentRule,
  useApproveAgentDecision,
  useRejectAgentDecision,
  useEvaluateAgentRules,
} from "@/shared/hooks/resources/agentHooks";
import { RESILIENCE } from "@/shared/branding";
import {
  Bot,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Zap,
} from "lucide-react";

interface AgentDashboardProps {
  context: "admin" | "tenant" | "client";
}

type DecisionStatus = "pending_approval" | "approved" | "rejected" | "executing" | "completed" | "failed" | "expired";
type Severity = "critical" | "high" | "medium" | "low" | "info";

function decisionStatusClasses(status: DecisionStatus): { badge: string; dot: string } {
  switch (status) {
    case "pending_approval":
      return {
        badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        dot: "bg-yellow-500",
      };
    case "approved":
    case "executing":
      return {
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        dot: "bg-blue-500",
      };
    case "completed":
      return {
        badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        dot: "bg-green-500",
      };
    case "rejected":
    case "failed":
    case "expired":
      return {
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        dot: "bg-red-500",
      };
    default:
      return {
        badge: "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400",
        dot: "bg-gray-500",
      };
  }
}

function severityClasses(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "high":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "medium":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "low":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400";
  }
}

export default function AgentDashboard({ context }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"rules" | "decisions">("rules");
  const isReadOnly = context === "client";

  const { data: rulesData, isLoading: rulesLoading, error: rulesError } = useFetchAgentRules();
  const { data: decisionsData, isLoading: decisionsLoading } = useFetchAgentDecisions();
  const toggleRule = useToggleAgentRule();
  const approveDecision = useApproveAgentDecision();
  const rejectDecision = useRejectAgentDecision();
  const evaluateNow = useEvaluateAgentRules();

  const rules = Array.isArray(rulesData) ? rulesData : (rulesData as Record<string, unknown>)?.data as Record<string, unknown>[] ?? [];
  const decisions = Array.isArray(decisionsData) ? decisionsData : (decisionsData as Record<string, unknown>)?.data as Record<string, unknown>[] ?? [];
  const pendingCount = decisions.filter((d: Record<string, unknown>) => d.status === "pending_approval").length;

  // ─── Error state (integration not configured) ─────────────────
  if (rulesError) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Automation Not Configured
          </h3>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            {RESILIENCE} Automation requires an active subscription.
            Please configure your {RESILIENCE} credentials in account settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Rules</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {rulesLoading ? "—" : rules.filter((r: Record<string, unknown>) => r.enabled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${pendingCount > 0 ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
              <Clock className={`h-5 w-5 ${pendingCount > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-gray-500"}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {decisionsLoading ? "—" : pendingCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Decisions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {decisionsLoading ? "—" : decisions.length}
                </p>
              </div>
            </div>
            {!isReadOnly && (
              <button
                onClick={() => evaluateNow.mutate()}
                disabled={evaluateNow.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Zap className="h-3.5 w-3.5" />
                {evaluateNow.isPending ? "Evaluating..." : "Evaluate Now"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "rules"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("decisions")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "decisions"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Decisions ({decisions.length})
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs text-white">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Rules tab */}
        {activeTab === "rules" && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rulesLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : rules.length === 0 ? (
              <div className="py-12 text-center">
                <Bot className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No agent rules configured yet.</p>
              </div>
            ) : (
              rules.map((rule: Record<string, unknown>) => (
                <div key={String(rule.id ?? rule.identifier)} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
                      <Bot className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {String(rule.name ?? "Unnamed Rule")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {String(rule.action_type ?? "")} · Approval: {String(rule.approval_mode ?? "manual")}
                        {rule.trigger_count ? ` · Triggered ${rule.trigger_count}×` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isReadOnly && (
                      <button
                        onClick={() => toggleRule.mutate({ identifier: String(rule.identifier) })}
                        disabled={toggleRule.isPending}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title={rule.enabled ? "Disable rule" : "Enable rule"}
                      >
                        {rule.enabled ? (
                          <ToggleRight className="h-6 w-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Decisions tab */}
        {activeTab === "decisions" && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {decisionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : decisions.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No decisions yet.</p>
              </div>
            ) : (
              decisions.map((decision: Record<string, unknown>) => {
                const status = String(decision.status ?? "pending_approval") as DecisionStatus;
                const severity = String(decision.severity ?? "info") as Severity;
                const cls = decisionStatusClasses(status);
                const isPending = status === "pending_approval";

                return (
                  <div key={String(decision.id ?? decision.identifier)} className="px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {String(decision.action_type ?? "Action")}
                          </p>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cls.dot}`} />
                            {status.replace(/_/g, " ")}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityClasses(severity)}`}>
                            {severity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {String(decision.reasoning ?? "")}
                        </p>
                        {decision.rule_name && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            Rule: {String(decision.rule_name)}
                          </p>
                        )}
                      </div>
                      {isPending && !isReadOnly && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => approveDecision.mutate({ identifier: String(decision.identifier) })}
                            disabled={approveDecision.isPending}
                            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectDecision.mutate({ identifier: String(decision.identifier) })}
                            disabled={rejectDecision.isPending}
                            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
