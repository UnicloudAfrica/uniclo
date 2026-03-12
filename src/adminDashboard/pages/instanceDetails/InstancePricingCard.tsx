import React from "react";
import { ModernCard } from "@/shared/components/ui";
import ModernTable from "@/shared/components/ui/ModernTable";
import StatusPill from "@/shared/components/ui/StatusPill";

import type {
  ActionTone,
  GenericRecord,
  PricingBreakdown,
  PricingLine,
} from "./instanceDetailsTypes";
import { formatDateTime, formatMoney, formatStatusText } from "./instanceDetailsUtils";

// ---------------------------------------------------------------------------
// Pricing Breakdown Card
// ---------------------------------------------------------------------------

interface InstancePricingCardProps {
  parsedPricingBreakdown: PricingBreakdown | null;
  currency: string;
}

const InstancePricingCard: React.FC<InstancePricingCardProps> = ({
  parsedPricingBreakdown,
  currency,
}) => {
  return (
    <ModernCard padding="xl" className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Pricing Breakdown</h2>
        <p className="text-sm text-slate-500">
          Monthly cost components as captured during provisioning.
        </p>
      </div>
      {parsedPricingBreakdown ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Subtotal
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatMoney(parsedPricingBreakdown.subtotal, currency)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Discount
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {parsedPricingBreakdown.discount
                  ? `-${formatMoney(parsedPricingBreakdown.discount, currency)}`
                  : "\u2014"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatMoney(parsedPricingBreakdown.tax, currency)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {formatMoney(parsedPricingBreakdown.total, currency)}
              </p>
            </div>
          </div>
          {parsedPricingBreakdown?.lines?.length ? (
            <ModernTable<PricingLine>
              data={(parsedPricingBreakdown.lines || []).map((line) => ({
                ...line,
                id: line.key || line.name || "line",
              }))}
              columns={[
                {
                  key: "name",
                  header: "LINE ITEM",
                  render: (_: unknown, line: PricingLine) => (
                    <div className="flex flex-col">
                      <span className="font-semibold">{line.name}</span>
                      <span className="text-xs text-slate-500">{line.frequency}</span>
                    </div>
                  ),
                },
                {
                  key: "quantity",
                  header: "QUANTITY",
                  render: (val: unknown) => (
                    <span className="text-slate-700">{String(val || "0")}</span>
                  ),
                },
                {
                  key: "unitAmount",
                  header: "UNIT AMOUNT",
                  render: (val: unknown, line: PricingLine) => (
                    <span className="text-slate-700">
                      {formatMoney(Number(val || 0), line.currency)}
                    </span>
                  ),
                },
                {
                  key: "total",
                  header: "TOTAL",
                  render: (val: unknown, line: PricingLine) => (
                    <span className="text-slate-900">
                      {formatMoney(
                        Number((val as string | number) || 0),
                        (line.currency || currency) as string
                      )}
                    </span>
                  ),
                },
              ]}
              searchable={false}
              filterable={false}
              exportable={false}
              paginated={false}
              enableAnimations={false}
            />
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Pricing breakdown is not available for this instance.
        </p>
      )}
    </ModernCard>
  );
};

// ---------------------------------------------------------------------------
// Transactions Card
// ---------------------------------------------------------------------------

interface TransactionsCardProps {
  enhancedTransactions: GenericRecord[];
  currency: string;
}

export const TransactionsCard: React.FC<TransactionsCardProps> = ({
  enhancedTransactions,
  currency,
}) => {
  return (
    <ModernCard padding="xl" className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Transactions</h2>
        <p className="text-sm text-slate-500">
          Recorded payments and reconciled charges linked to this instance.
        </p>
      </div>
      <div className="overflow-x-auto">
        {enhancedTransactions.length ? (
          <ModernTable<GenericRecord>
            data={enhancedTransactions.map((tx: GenericRecord) => ({
              ...tx,
              id: (tx["id"] || tx["reference"]) as string,
            }))}
            columns={[
              {
                key: "identifier",
                header: "IDENTIFIER",
                render: (_: unknown, tx: GenericRecord) => (
                  <span className="font-medium">
                    {String(tx["identifier"] || tx["reference"] || "\u2014")}
                  </span>
                ),
              },
              {
                key: "type",
                header: "TYPE",
                render: (_: unknown, tx: GenericRecord) => (
                  <span>{formatStatusText(tx["transaction_type"] || tx["type"])}</span>
                ),
              },
              {
                key: "amount",
                header: "AMOUNT",
                render: (val: unknown, tx: GenericRecord) => (
                  <span>
                    {formatMoney(Number(val || 0), (tx["currency"] || currency) as string)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "STATUS",
                render: (val: unknown) => {
                  const s = String(val || "").toLowerCase();
                  let tone: ActionTone = "neutral";
                  if (["success", "paid", "completed"].includes(s)) tone = "success";
                  else if (["failed", "refunded"].includes(s)) tone = "danger";

                  return <StatusPill label={formatStatusText(String(val))} tone={tone} />;
                },
              },
              {
                key: "payment_gateway",
                header: "GATEWAY",
                render: (_: unknown, tx: GenericRecord) => {
                  const gatewayValue = tx["payment_gateway"] ?? tx["gateway"];
                  const label =
                    gatewayValue !== null && gatewayValue !== undefined && gatewayValue !== ""
                      ? String(gatewayValue)
                      : "\u2014";
                  return <span>{label}</span>;
                },
              },
              {
                key: "created_at",
                header: "CREATED",
                render: (val: unknown) => (
                  <span>{val ? formatDateTime(val as string | number | Date) : "\u2014"}</span>
                ),
              },
            ]}
            searchable={false}
            filterable={false}
            exportable={false}
            paginated={false}
            enableAnimations={false}
          />
        ) : (
          <p className="text-sm text-slate-500">
            No billing transactions linked to this instance yet.
          </p>
        )}
      </div>
    </ModernCard>
  );
};

export default InstancePricingCard;
