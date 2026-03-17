import { useCallback, useMemo, useState } from "react";
import { ModernButton, ModernInput, ModernModal, ModernSelect } from "@/shared/components/ui";
import type { ModalAction } from "@/shared/components/ui/ModernModal";
import type {
  TenantPricingCreatePayload,
  TenantPricingOverride,
} from "@/hooks/tenantHooks/tenantPricingHooks";
import { useFetchAvailabilityZones } from "@/hooks/adminHooks/regionHooks";
import ToastUtils from "@/utils/toastUtil";
import type {
  OverrideScope,
  PricingCatalogRow,
  TenantRegion,
  OverrideLookup,
} from "./pricingOverridesTypes";
import { formatCurrency } from "./pricingOverridesTypes";

/* ------------------------------------------------------------------ */
/*  Component props                                                    */
/* ------------------------------------------------------------------ */

export interface PriceOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: PricingCatalogRow | null;
  overrideInfo: OverrideLookup | null;
  activeRegion: TenantRegion | undefined;
  selectedRegion: string;
  regions: TenantRegion[];
  isSaving: boolean;
  onUpsert: (payload: TenantPricingCreatePayload) => Promise<unknown>;
  onUpdate: (params: { id: string | number; payload: { price_usd: number } }) => Promise<unknown>;
  onSaveComplete: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PriceOverrideModal: React.FC<PriceOverrideModalProps> = ({
  isOpen,
  onClose,
  row,
  overrideInfo,
  activeRegion,
  selectedRegion,
  regions,
  isSaving,
  onUpsert,
  onUpdate,
  onSaveComplete,
}) => {
  const override: TenantPricingOverride | null = overrideInfo?.row ?? null;
  const hasExistingOverride = Boolean(override?.id);

  const adminDefault = row?.pricing?.admin?.price_usd;
  const adminScope = row?.pricing?.admin?.scope;

  const [overrideScope, setOverrideScope] = useState<OverrideScope>(
    overrideInfo?.scope || "region"
  );
  const [priceValue, setPriceValue] = useState(
    hasExistingOverride ? String(override?.price_usd ?? "") : String(adminDefault ?? "")
  );

  /* AZ scope state */
  const [azRegion, setAzRegion] = useState(selectedRegion);
  const [selectedAz, setSelectedAz] = useState("");

  const { data: availabilityZones, isFetching: isAzFetching } = useFetchAvailabilityZones(
    overrideScope === "availability_zone" ? azRegion : null
  );

  const azOptions = useMemo(
    () =>
      (availabilityZones ?? []).map((az) => ({
        value: az.code,
        label: az.name ? `${az.name} (${az.code})` : az.code,
      })),
    [availabilityZones]
  );

  /* Re-sync local state when the modal opens with new data */
  const resetForRow = useCallback(
    (newRow: PricingCatalogRow | null, newOverrideInfo: OverrideLookup | null) => {
      const newOverride = newOverrideInfo?.row ?? null;
      const hasOvr = Boolean(newOverride?.id);
      const newAdminScope = newRow?.pricing?.admin?.scope;

      if (newAdminScope !== "country" && !newOverrideInfo?.scope) {
        setOverrideScope("region");
      } else {
        setOverrideScope(newOverrideInfo?.scope || "region");
      }
      setPriceValue(
        hasOvr
          ? String(newOverride?.price_usd ?? "")
          : String(newRow?.pricing?.admin?.price_usd ?? "")
      );

      /* Reset AZ state */
      setAzRegion(selectedRegion);
      if (newOverrideInfo?.scope === "availability_zone" && newOverride) {
        setSelectedAz(String(newOverride.availability_zone ?? ""));
      } else {
        setSelectedAz("");
      }
    },
    [selectedRegion]
  );

  /* Expose resetForRow so the parent can call it when opening the modal.
     We achieve this by also reacting to prop changes: if the row identity changes
     we reset. We use a ref-key approach via the product id. */
  const rowProductId = row?.product?.productable_id;
  const [lastProductId, setLastProductId] = useState<string | number | undefined>(undefined);
  if (isOpen && rowProductId !== undefined && rowProductId !== lastProductId) {
    setLastProductId(rowProductId);
    resetForRow(row, overrideInfo);
  }
  if (!isOpen && lastProductId !== undefined) {
    // Modal closed: clear tracking so next open triggers a reset
    setLastProductId(undefined);
  }

  const parsedPrice = Number(priceValue);
  const hasNumericPrice = Number.isFinite(parsedPrice);
  const isBelowAdmin =
    hasNumericPrice &&
    adminDefault !== null &&
    adminDefault !== undefined &&
    parsedPrice < adminDefault;

  const handleSave = useCallback(async () => {
    if (!row?.product || !activeRegion?.provider) {
      ToastUtils.error("Missing product or region details.");
      return;
    }

    const product = row.product;
    if (
      !product.productable_type ||
      product.productable_id === null ||
      product.productable_id === undefined
    ) {
      ToastUtils.error("Missing product details.");
      return;
    }

    if (adminDefault === null || adminDefault === undefined) {
      ToastUtils.error("Admin default price must be set before tenant price settings.");
      return;
    }
    if (overrideScope === "country" && adminScope !== "country") {
      ToastUtils.error("Country price settings require a country-level admin default price.");
      return;
    }
    if (overrideScope === "availability_zone" && !selectedAz) {
      ToastUtils.error("Select an availability zone.");
      return;
    }

    const parsed = Number(priceValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      ToastUtils.error("Enter a valid tenant price.");
      return;
    }
    if (parsed < adminDefault) {
      ToastUtils.error("Tenant price cannot be below admin default.");
      return;
    }

    const overrideId = override?.id;

    try {
      if (overrideId !== undefined && overrideId !== null) {
        await onUpdate({
          id: overrideId,
          payload: { price_usd: parsed },
        });
      } else {
        const payload: TenantPricingCreatePayload = {
          productable_type: product.productable_type,
          productable_id: product.productable_id,
          provider: String(activeRegion.provider),
          price_usd: parsed,
        };

        if (overrideScope === "country") {
          if (!activeRegion?.country_code) {
            ToastUtils.error("Region is missing a country code.");
            return;
          }
          payload.country_code = activeRegion.country_code;
        } else if (overrideScope === "availability_zone") {
          payload.region = azRegion;
          payload.availability_zone = selectedAz;
        } else {
          payload.region = selectedRegion;
        }

        await onUpsert(payload);
      }

      onSaveComplete();
      onClose();
    } catch {
      // tenantApi already displays toast errors
    }
  }, [
    row,
    activeRegion,
    overrideScope,
    priceValue,
    adminDefault,
    adminScope,
    override,
    onUpdate,
    onUpsert,
    selectedRegion,
    selectedAz,
    azRegion,
    onSaveComplete,
    onClose,
  ]);

  const modalActions: ModalAction[] = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: onClose,
    },
    {
      label: isSaving ? "Saving..." : "Save Override",
      variant: "primary",
      onClick: () => {
        void handleSave();
      },
      disabled: isSaving || isBelowAdmin,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Set price setting"
      subtitle={row?.product?.name || ""}
      actions={modalActions}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Admin default price: {formatCurrency(adminDefault, "USD")}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Price scope
          </p>
          <div className="flex flex-wrap gap-2">
            <ModernButton
              variant={overrideScope === "region" ? "primary" : "outline"}
              size="sm"
              onClick={() => setOverrideScope("region")}
              isDisabled={hasExistingOverride}
            >
              Region ({activeRegion?.code || "\u2014"})
            </ModernButton>
            <ModernButton
              variant={overrideScope === "country" ? "primary" : "outline"}
              size="sm"
              onClick={() => setOverrideScope("country")}
              isDisabled={
                hasExistingOverride || !activeRegion?.country_code || adminScope !== "country"
              }
            >
              Country ({activeRegion?.country_code || "\u2014"})
            </ModernButton>
            <ModernButton
              variant={overrideScope === "availability_zone" ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                setOverrideScope("availability_zone");
                setAzRegion(selectedRegion);
                setSelectedAz("");
              }}
              isDisabled={hasExistingOverride}
            >
              Availability Zone
            </ModernButton>
          </div>
          {hasExistingOverride && (
            <p className="text-xs text-slate-400">
              Scope cannot be changed on existing overrides. Reset first to change scope.
            </p>
          )}
          {!hasExistingOverride && adminScope !== "country" && (
            <p className="text-xs text-slate-400">
              Country price settings require a country-level admin default price.
            </p>
          )}
        </div>

        {overrideScope === "availability_zone" && (
          <div className="space-y-3">
            <ModernSelect
              label="Region"
              value={azRegion}
              onChange={(event) => {
                setAzRegion(event.target.value);
                setSelectedAz("");
              }}
              options={regions.map((region) => ({
                value: region.code,
                label: `${region.name} (${region.code})`,
              }))}
              disabled={hasExistingOverride || !regions.length}
            />
            <ModernSelect
              label="Availability Zone"
              value={selectedAz}
              onChange={(event) => setSelectedAz(event.target.value)}
              options={azOptions}
              disabled={hasExistingOverride || !azRegion || isAzFetching}
              placeholder={isAzFetching ? "Loading zones..." : "Select availability zone"}
            />
          </div>
        )}

        <ModernInput
          label="Tenant price (USD)"
          type="number"
          min="0"
          step="0.01"
          value={priceValue}
          onChange={(event) => setPriceValue(event.target.value)}
          placeholder="0.00"
        />
        {isBelowAdmin && (
          <p className="text-xs text-rose-500">
            Tenant price cannot be below admin default ({formatCurrency(adminDefault, "USD")}
            ).
          </p>
        )}
      </div>
    </ModernModal>
  );
};

export default PriceOverrideModal;
