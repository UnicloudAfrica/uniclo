import { useState } from "react";
import { Plus } from "lucide-react";
import useCartStore from "@/stores/cartStore";

interface GenericConfiguratorProps {
  title: string;
  category: string;
  fields: { key: string; label: string; type: "number" | "select"; options?: { value: string; label: string }[]; default?: number; unit?: string }[];
  pricePerUnit: number;
  priceLabel: string;
}

export default function GenericConfigurator({ title, category, fields, pricePerUnit, priceLabel }: GenericConfiguratorProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    fields.forEach((f) => { init[f.key] = f.default ?? 1; });
    return init;
  });

  const quantity = values.quantity ?? 1;
  const total = pricePerUnit * quantity;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-gray-700">{f.label}{f.unit ? ` (${f.unit})` : ""}</label>
            {f.type === "number" ? (
              <input type="number" value={values[f.key] ?? 1} onChange={(e) => setValues({ ...values, [f.key]: +e.target.value })} min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            ) : (
              <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: +e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{priceLabel}</p>
          <p className="text-lg font-bold text-primary-700">₦{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo</p>
        </div>
        <button
          onClick={() => addItem({ category, name: title, description: `${quantity} units`, config: values, monthly_cost: total, one_time_cost: 0, quantity: 1, currency: "NGN" })}
          className="mt-3 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />Add to Cart
        </button>
      </div>
    </div>
  );
}
