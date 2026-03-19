import { useState, useEffect } from "react";
import ModernModal from "@/shared/components/ui/ModernModal";
import { Plus, Trash2 } from "lucide-react";
import type { PricingTier } from "@/hooks/adminHooks/adminAnyCloudFlowPricingHooks";
import { useUpdateAnyCloudFlowTiers } from "@/hooks/adminHooks/adminAnyCloudFlowPricingHooks";
import ToastUtils from "@/utils/toastUtil";

interface TieredPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: number;
    name: string;
    price_usd: number;
    pricing_tiers: PricingTier[] | null;
    unit_label?: string;
  } | null;
}

const emptyTier = (): PricingTier => ({
  min_units: 1,
  max_units: null,
  price_usd: 0,
  label: "",
});

export default function TieredPricingModal({ isOpen, onClose, service }: TieredPricingModalProps) {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const { mutate: updateTiers, isPending } = useUpdateAnyCloudFlowTiers();

  useEffect(() => {
    if (service?.pricing_tiers?.length) {
      setTiers(service.pricing_tiers.map((t) => ({ ...t })));
    } else {
      setTiers([]);
    }
  }, [service, isOpen]);

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newTier = emptyTier();
    if (lastTier) {
      newTier.min_units = (lastTier.max_units ?? lastTier.min_units) + 1;
    }
    setTiers([...tiers, newTier]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof PricingTier, value: any) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index]!, [field]: value };
    setTiers(updated);
  };

  const handleSave = () => {
    if (!service) return;

    // Validate tiers
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i]!;
      if (tier.min_units < 1) {
        ToastUtils.error(`Tier ${i + 1}: Min units must be at least 1.`);
        return;
      }
      if (tier.max_units !== null && tier.max_units < tier.min_units) {
        ToastUtils.error(`Tier ${i + 1}: Max units must be ≥ min units.`);
        return;
      }
      if (tier.price_usd < 0) {
        ToastUtils.error(`Tier ${i + 1}: Price must be ≥ 0.`);
        return;
      }
    }

    updateTiers(
      {
        id: service.id,
        pricing_tiers: tiers.length > 0 ? tiers : null,
      },
      {
        onSuccess: () => {
          ToastUtils.success(`Pricing tiers updated for ${service.name}.`);
          onClose();
        },
        onError: () => {
          ToastUtils.error("Failed to update pricing tiers.");
        },
      }
    );
  };

  if (!service) return null;

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Volume Discount Tiers"
      subtitle={service.name}
      size="lg"
      loading={isPending}
      actions={[
        { label: "Cancel", variant: "outline" as const, onClick: onClose },
        { label: isPending ? "Saving..." : "Save Tiers", variant: "primary" as const, onClick: handleSave, disabled: isPending },
      ]}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Define quantity-based discounts. Customers ordering more units get a lower per-unit price.
          Base price: <span className="font-semibold">${service.price_usd?.toFixed(2)}</span>{" "}
          {service.unit_label && <span>({service.unit_label})</span>}
        </p>

        {tiers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-6 py-8 text-center">
            <p className="text-sm text-slate-500">No volume discount tiers configured.</p>
            <p className="mt-1 text-xs text-slate-400">
              All quantities will be charged at the base price.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto] gap-2 px-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              <span>Min Units</span>
              <span>Max Units</span>
              <span>Price (USD)</span>
              <span>Label</span>
              <span />
            </div>
            {tiers.map((tier, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto] items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-2"
              >
                <input
                  type="number"
                  min="1"
                  value={tier.min_units}
                  onChange={(e) => updateTier(index, "min_units", parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <input
                  type="number"
                  min="1"
                  value={tier.max_units ?? ""}
                  placeholder="∞"
                  onChange={(e) =>
                    updateTier(
                      index,
                      "max_units",
                      e.target.value === "" ? null : parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tier.price_usd}
                  onChange={(e) =>
                    updateTier(index, "price_usd", parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <input
                  type="text"
                  value={tier.label ?? ""}
                  placeholder="e.g. 5–9 VMs"
                  onChange={(e) => updateTier(index, "label", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Remove tier"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addTier}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 transition hover:border-primary-300 hover:text-primary-600"
        >
          <Plus className="h-4 w-4" />
          Add Tier
        </button>
      </div>
    </ModernModal>
  );
}
