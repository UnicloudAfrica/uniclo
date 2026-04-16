import { Trash2, ShoppingCart, ExternalLink } from "lucide-react";
import useCartStore, { useCartSubtotal, useCartOneTime } from "@/stores/cartStore";

interface CartPanelProps {
  vatRate?: number;
  currency?: string;
}

export default function CartPanel({ vatRate = 7.5, currency = "NGN" }: CartPanelProps) {
  const { items, removeItem, clearCart } = useCartStore();
  const subtotal = useCartSubtotal();
  const oneTime = useCartOneTime();
  const tax = subtotal * (vatRate / 100);
  const total = subtotal + tax;

  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency;
  const fmt = (v: number) => `${symbol}${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <ShoppingCart className="h-4 w-4" />Cart ({items.length})
        </h3>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-[10px] text-red-500 hover:underline">Clear</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {items.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400">Add services to see pricing</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.description}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">× {item.quantity}</span>
                  <span className="font-semibold text-gray-700">
                    {fmt(item.monthly_cost * item.quantity)}/mo
                  </span>
                </div>
                {item.one_time_cost > 0 && (
                  <div className="text-[10px] text-gray-400">+ {fmt(item.one_time_cost * item.quantity)} one-time</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t pt-3 space-y-1.5">
          {oneTime > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>One-time</span><span>{fmt(oneTime)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-500">
            <span>Monthly</span><span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Tax ({vatRate}%)</span><span>{fmt(tax)}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 text-sm font-bold text-gray-900">
            <span>Total/mo</span><span className="text-primary-700">{fmt(total)}</span>
          </div>
          <div className="mt-3 space-y-2">
            <a href="/sign-up" className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700">
              Sign Up <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
