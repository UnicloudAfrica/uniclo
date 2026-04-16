import React, { useState, useMemo } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Server,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import ModernModal from "@/shared/components/ui/ModernModal";
import { ModernButton } from "@/shared/components/ui";
import {
  useResizeOptions,
  useResizeConfirm,
  type ResizeOption,
} from "@/hooks/resizeBillingHooks";
import { useFetchWalletBalance } from "@/hooks/walletHooks";
import { formatCurrencyValue } from "@/utils/instanceCreationUtils";
import { getCurrencySymbol } from "@/utils/resource";
import ToastUtils from "@/utils/toastUtil";

interface InstanceResizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: number;
  instanceName?: string;
  currentStatus?: string;
  isAdmin?: boolean;
  onSuccess?: () => void;
}

const InstanceResizeModal: React.FC<InstanceResizeModalProps> = ({
  isOpen,
  onClose,
  instanceId,
  instanceName,
  currentStatus,
  isAdmin = false,
  onSuccess,
}) => {
  const [selectedOption, setSelectedOption] = useState<ResizeOption | null>(null);
  const [skipBilling, setSkipBilling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const {
    data: resizeData,
    isLoading: optionsLoading,
    isError: optionsError,
    error: optionsErrorObj,
  } = useResizeOptions("instance", instanceId, { enabled: isOpen && !!instanceId });

  const resizeConfirm = useResizeConfirm();

  const currency = selectedOption?.currency || resizeData?.options?.[0]?.currency || "NGN";
  const { data: walletData } = useFetchWalletBalance(currency, { enabled: isOpen });

  const walletBalance = walletData?.balance ?? selectedOption?.wallet_balance ?? 0;
  const symbol = getCurrencySymbol(currency);

  const { upgrades, downgrades } = useMemo(() => {
    const opts = resizeData?.options ?? [];
    return {
      upgrades: opts.filter((o) => o.adjustment_type === "upgrade"),
      downgrades: opts.filter((o) => o.adjustment_type === "downgrade"),
    };
  }, [resizeData]);

  const handleConfirm = async () => {
    if (!selectedOption) return;

    setConfirming(true);
    try {
      await resizeConfirm.mutateAsync({
        resource_type: "instance",
        resource_id: instanceId,
        new_product_id: selectedOption.new_product_id,
        accepted_amount: selectedOption.prorated_amount,
      });
      ToastUtils.success("Resize initiated successfully.");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Resize failed.";
      ToastUtils.error(message);
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    setSkipBilling(false);
    setConfirming(false);
    onClose();
  };

  const isActive = (currentStatus || "").toLowerCase() === "active";

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Resize Instance"
      subtitle={instanceName ? `Modify resources for ${instanceName}` : undefined}
      size="lg"
      loading={optionsLoading}
    >
      <div className="space-y-6">
        {/* Status guard */}
        {!isActive && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Instance must be active to resize
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Current status: {currentStatus || "unknown"}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {optionsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">Loading resize options...</span>
          </div>
        )}

        {/* Error */}
        {optionsError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">
              {optionsErrorObj instanceof Error
                ? optionsErrorObj.message
                : "Failed to load resize options."}
            </p>
          </div>
        )}

        {/* Current Plan */}
        {resizeData?.current_product && !optionsLoading && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Plan
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {resizeData.current_product.name}
            </p>
            <p className="text-sm text-gray-500">
              {symbol}
              {formatCurrencyValue(resizeData.current_product.price)}/mo
            </p>
          </div>
        )}

        {/* Admin fast-track toggle */}
        {isAdmin && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={skipBilling}
              onChange={(e) => setSkipBilling(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Skip billing (admin fast-track)
            </span>
          </label>
        )}

        {/* Upgrade Options */}
        {upgrades.length > 0 && !optionsLoading && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Upgrade
              </span>
            </div>
            <div className="space-y-2">
              {upgrades.map((opt) => (
                <PlanOption
                  key={opt.new_product_id}
                  option={opt}
                  selected={selectedOption?.new_product_id === opt.new_product_id}
                  onSelect={() => setSelectedOption(opt)}
                  symbol={symbol}
                  skipBilling={skipBilling}
                />
              ))}
            </div>
          </div>
        )}

        {/* Downgrade Options */}
        {downgrades.length > 0 && !optionsLoading && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Downgrade
              </span>
            </div>
            <div className="space-y-2">
              {downgrades.map((opt) => (
                <PlanOption
                  key={opt.new_product_id}
                  option={opt}
                  selected={selectedOption?.new_product_id === opt.new_product_id}
                  onSelect={() => setSelectedOption(opt)}
                  symbol={symbol}
                  skipBilling={skipBilling}
                />
              ))}
            </div>
          </div>
        )}

        {/* No options */}
        {!optionsLoading &&
          !optionsError &&
          upgrades.length === 0 &&
          downgrades.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">
              No resize options available for this instance.
            </p>
          )}

        {/* Selected plan summary */}
        {selectedOption && !skipBilling && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Adjustment type</span>
                <span
                  className={`font-medium ${
                    selectedOption.adjustment_type === "upgrade"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {selectedOption.adjustment_type === "upgrade" ? "Upgrade" : "Downgrade"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">New price</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {symbol}
                  {formatCurrencyValue(selectedOption.new_price)}/mo
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Prorated {selectedOption.adjustment_type === "upgrade" ? "charge" : "credit"}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedOption.adjustment_type === "upgrade" ? "" : "-"}
                  {symbol}
                  {formatCurrencyValue(Math.abs(selectedOption.prorated_amount))}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Days remaining</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedOption.days_remaining} of {selectedOption.total_days} days
                </span>
              </div>

              {/* Wallet balance */}
              {selectedOption.adjustment_type === "upgrade" && (
                <>
                  <hr className="border-blue-200 dark:border-blue-700" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Wallet balance</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {symbol}
                      {formatCurrencyValue(walletBalance)}
                    </span>
                  </div>
                  {!selectedOption.sufficient_funds && (
                    <div className="flex items-start gap-2 rounded-md bg-red-100 p-2 dark:bg-red-900/30">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <p className="text-xs text-red-700 dark:text-red-300">
                        Insufficient funds. You need {symbol}
                        {formatCurrencyValue(selectedOption.shortfall)} more.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <ModernButton variant="outline" onClick={handleClose} disabled={confirming}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleConfirm}
            disabled={
              !selectedOption ||
              confirming ||
              (!skipBilling &&
                selectedOption?.adjustment_type === "upgrade" &&
                !selectedOption?.sufficient_funds) ||
              (!isActive && !isAdmin)
            }
            loading={confirming}
          >
            {confirming ? (
              "Resizing..."
            ) : selectedOption ? (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Confirm{" "}
                {selectedOption.adjustment_type === "upgrade" ? "Upgrade" : "Downgrade"}
              </>
            ) : (
              "Select a plan"
            )}
          </ModernButton>
        </div>
      </div>
    </ModernModal>
  );
};

// --- Plan Option Card ---

interface PlanOptionProps {
  option: ResizeOption;
  selected: boolean;
  onSelect: () => void;
  symbol: string;
  skipBilling: boolean;
}

const PlanOption: React.FC<PlanOptionProps> = ({
  option,
  selected,
  onSelect,
  symbol,
  skipBilling,
}) => {
  const isUpgrade = option.adjustment_type === "upgrade";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:border-blue-400 dark:bg-blue-950/30"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {option.new_product_name || `Plan #${option.new_product_id}`}
          </p>
          <p className="text-xs text-gray-500">
            {symbol}
            {formatCurrencyValue(option.new_price)}/mo
          </p>
        </div>
        {!skipBilling && (
          <div className="text-right">
            <p
              className={`text-sm font-semibold ${
                isUpgrade ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {isUpgrade ? "+" : "-"}
              {symbol}
              {formatCurrencyValue(Math.abs(option.prorated_amount))}
            </p>
            <p className="text-xs text-gray-400">
              {option.days_remaining}d remaining
            </p>
          </div>
        )}
      </div>
    </button>
  );
};

export default InstanceResizeModal;
