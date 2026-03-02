import React, { useMemo } from "react";
import { Cpu, HardDrive, Network, ListChecks, Tag, BadgePercent } from "lucide-react";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernTable from "../../../shared/components/ui/ModernTable";
import type { Column } from "../../../shared/components/ui/ModernTable";

type SummaryTone = "primary" | "success" | "neutral";

type SummaryTileProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone?: SummaryTone;
};

type PricingRequest = {
  region?: string;
  months?: number;
  number_of_instances?: number;
  bandwidth_count?: number | string | null;
  floating_ip_count?: number | string | null;
  cross_connect_id?: string | number | null;
  _display?: {
    compute?: string;
    os?: string;
    storage?: string;
  };
};

type GroupedItem = {
  id: string;
  index: number;
  region: string;
  months: number;
  instances: number;
  compute: string;
  os: string;
  storage: string;
  bandwidth: string | null;
  floatingIps: string | null;
  label: string;
  highlight: string;
  description: string;
};

type GroupedItems = {
  compute: GroupedItem[];
  storage: GroupedItem[];
  network: GroupedItem[];
  other: GroupedItem[];
};

type ObjectStorageRequest = {
  id?: string | number;
  region?: string;
  quantity?: number | string;
  months?: number | string;
  _display?: {
    name?: string;
  };
  [key: string]: unknown;
};

type ProductSummaryFormData = {
  apply_total_discount?: boolean;
  total_discount_value?: string | number;
  total_discount_type?: string;
  total_discount_label?: string;
};

type ProductSummaryStepProps = {
  pricingRequests: PricingRequest[];
  objectStorageRequests?: ObjectStorageRequest[];
  formData: ProductSummaryFormData;
};

const SummaryTile = ({ icon: Icon, label, value, tone }: SummaryTileProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          tone === "primary"
            ? "bg-primary-50 text-primary-600"
            : tone === "success"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

const ProductSummaryStep = ({
  pricingRequests,
  objectStorageRequests = [],
  formData,
}: ProductSummaryStepProps) => {
  const _hasItems = pricingRequests.length > 0 || objectStorageRequests?.length > 0;
  const groupedItems = useMemo(() => {
    const groups: GroupedItems = {
      compute: [],
      storage: [],
      network: [],
      other: [],
    };

    pricingRequests.forEach((req: PricingRequest, index: number) => {
      const base = {
        id: `pricing-${index}`,
        index,
        region: req.region || "Unknown region",
        months: req.months || 1,
        instances: req.number_of_instances || 1,
        compute: req._display?.compute || "Unknown Compute",
        os: req._display?.os || "Unknown OS",
        storage: req._display?.storage || "Unknown Storage",
        bandwidth: req.bandwidth_count ? `${req.bandwidth_count} bandwidth units` : null,
        floatingIps: req.floating_ip_count ? `${req.floating_ip_count} floating IPs` : null,
      };

      groups.compute.push({
        ...base,
        label: "Compute instance",
        highlight: `${base.instances}× ${base.compute}`,
        description: `${base.os} • ${base.months} month${base.months === 1 ? "" : "s"}`,
      });

      groups.storage.push({
        ...base,
        label: "Storage",
        highlight: base.storage,
        description: `${base.instances} attachment${
          base.instances === 1 ? "" : "s"
        } • ${base.months} month${base.months === 1 ? "" : "s"}`,
      });

      if (base.bandwidth) {
        groups.network.push({
          ...base,
          label: "Bandwidth",
          highlight: base.bandwidth,
          description: `${base.months} month${
            base.months === 1 ? "" : "s"
          } • Region ${base.region}`,
        });
      }

      if (base.floatingIps) {
        groups.network.push({
          ...base,
          label: "Floating IPs",
          highlight: base.floatingIps,
          description: `${base.months} month${
            base.months === 1 ? "" : "s"
          } • Region ${base.region}`,
        });
      }

      if (req.cross_connect_id) {
        groups.other.push({
          ...base,
          label: "Cross connect",
          highlight: "Dedicated connectivity",
          description: `${base.months} month${
            base.months === 1 ? "" : "s"
          } • Region ${base.region}`,
        });
      }
    });

    return groups;
  }, [pricingRequests]);

  const discountApplied = formData.apply_total_discount && formData.total_discount_value;

  type SectionProps = {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    items: GroupedItem[];
    tone?: SummaryTone;
  };

  const Section = ({ icon: Icon, title, items, tone }: SectionProps) => {
    if (!items.length) return null;
    return (
      <ModernCard padding="none" variant="outlined" className="space-y-4 p-4 md:p-6 lg:p-8">
        <header className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
              tone === "primary"
                ? "bg-primary-50 text-primary-600"
                : tone === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </header>

        <div className="space-y-4">
          {items.map((item: GroupedItem, idx: number) => (
            <div
              key={`${item.label}-${idx}`}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-900">{item.highlight}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                  {item.region}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ModernCard>
    );
  };

  const objectStorageColumns: Column<ObjectStorageRequest & { id: string }>[] = [
    {
      key: "name",
      header: "CONFIGURATION",
      render: (_: unknown, item: ObjectStorageRequest) => (
        <span className="text-sm font-medium text-slate-900">
          {item._display?.name || "Silo Storage"}
        </span>
      ),
    },
    {
      key: "region",
      header: "REGION",
      render: (val: unknown) => <span className="text-sm text-slate-500">{String(val || "")}</span>,
    },
    {
      key: "details",
      header: "DETAILS",
      render: (_: unknown, item: ObjectStorageRequest) => (
        <span className="text-sm text-slate-500">
          {item.quantity} GB for {item.months} month{item.months === 1 ? "" : "s"}
        </span>
      ),
    },
  ];

  const objectStorageData = useMemo(
    () =>
      objectStorageRequests.map((item: ObjectStorageRequest, idx: number) => ({
        ...item,
        id: `os-${idx}`,
      })),
    [objectStorageRequests]
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <h3 className="text-lg font-semibold text-slate-900">Product Summary</h3>
        <p className="text-sm text-slate-500">
          Validate grouped resources before moving to final review.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile icon={ListChecks} label="Configurations" value={pricingRequests.length} />
        <SummaryTile
          icon={Cpu}
          label="Compute Items"
          value={groupedItems.compute.length}
          tone="primary"
        />
        <SummaryTile
          icon={HardDrive}
          label="Storage Items"
          value={groupedItems.storage.length}
          tone="success"
        />
        <SummaryTile icon={Network} label="Network Items" value={groupedItems.network.length} />
      </div>

      {discountApplied && (
        <ModernCard
          padding="xl"
          variant="filled"
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <BadgePercent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700">Global discount active</p>
              <p className="text-sm text-amber-600">
                {formData.total_discount_type === "percent"
                  ? `${formData.total_discount_value}% off every item`
                  : `-${formData.total_discount_value} applied to order`}
                {formData.total_discount_label ? ` • ${formData.total_discount_label}` : ""}
              </p>
            </div>
          </div>
        </ModernCard>
      )}

      {objectStorageData.length > 0 && (
        <ModernCard padding="xl" className="space-y-6">
          <header className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Silo Storage Items</h3>
              <p className="text-sm text-slate-500">
                {objectStorageData.length} storage configuration
                {objectStorageData.length === 1 ? "" : "s"}
              </p>
            </div>
          </header>

          <ModernTable
            data={objectStorageData}
            columns={objectStorageColumns}
            searchable={false}
            filterable={false}
            exportable={false}
            paginated={false}
            enableAnimations={false}
          />
        </ModernCard>
      )}

      <Section icon={Cpu} title="Compute resources" tone="primary" items={groupedItems.compute} />
      <Section
        icon={HardDrive}
        title="Storage allocations"
        tone="success"
        items={groupedItems.storage}
      />
      <Section icon={Network} title="Network additions" items={groupedItems.network} />
      <Section icon={Tag} title="Other resources" items={groupedItems.other} />
    </div>
  );
};

export default ProductSummaryStep;
