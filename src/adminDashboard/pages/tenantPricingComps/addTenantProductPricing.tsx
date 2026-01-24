// @ts-nocheck
import React, { useMemo } from "react";
import ModalShell from "../../components/ModalShell";
import ModernInput from "../../../shared/components/ui/ModernInput";
import { ModernButton } from "../../../shared/components/ui";
import { useForm } from "react-hook-form";

const AddTenantProductPricing = ({ isOpen, onClose, defaultPrice, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      price_usd: defaultPrice ?? "",
    },
  });

  const modalProps = useMemo(
    () => ({
      title: "Enable Silo Storage",
      description:
        "Set the price per GB-month for this tenant. Leave blank to inherit the platform default.",
      size: "md",
    }),
    []
  );

  const submitHandler = handleSubmit((values) => {
    onSubmit({
      price_usd: values.price_usd !== "" ? Number(values.price_usd) : null,
    });
    reset();
  });

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} {...modalProps}>
      <form onSubmit={submitHandler} className="space-y-6">
        <ModernInput
          type="number"
          step="0.0001"
          label="Price per GB-month"
          placeholder={defaultPrice ? `Default: $${Number(defaultPrice).toFixed(4)}` : "0.045"}
          {...register("price_usd", {
            validate: (value) =>
              value === "" || Number(value) >= 0 || "Price must be zero or higher",
          })}
          error={errors.price_usd?.message}
        />

        <div className="flex justify-end gap-3">
          <ModernButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </ModernButton>
          <ModernButton type="submit" variant="primary" isLoading={isSubmitting}>
            Save
          </ModernButton>
        </div>
      </form>
    </ModalShell>
  );
};

export default AddTenantProductPricing;
