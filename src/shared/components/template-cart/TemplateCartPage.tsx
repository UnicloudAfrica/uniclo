// Shared Template Cart Page - Works for Admin/Tenant/Client
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTemplateCart } from "../../../stores/templateCartStore";
import { useApiContext } from "../../../hooks/useApiContext";
import { ShoppingCart, Trash2, ArrowLeft } from "lucide-react";

const TemplateCartPage: React.FC = () => {
  const navigate = useNavigate();
  const { context } = useApiContext();
  const { items, removeFromCart, updateQuantity, clearCart, getCartTotal } = useTemplateCart();
  const { monthly, yearly } = getCartTotal();

  const handleProceedToCheckout = () => {
    const checkoutPath =
      context === "admin"
        ? "/admin-dashboard/cart/checkout"
        : context === "tenant"
          ? "/tenant-dashboard/cart/checkout"
          : "/client-dashboard/cart/checkout";

    navigate(checkoutPath);
  };

  const handleContinueShopping = () => {
    const browsePath =
      context === "admin"
        ? "/admin-dashboard/instances/create"
        : context === "tenant"
          ? "/tenant-dashboard/instances/create"
          : "/client-dashboard/instances/create";

    navigate(browsePath);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-600 mb-6">Browse our template gallery to get started</p>
          <button
            onClick={handleContinueShopping}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Browse Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>
          <p className="text-slate-600 mt-1">
            {items.length} {items.length === 1 ? "template" : "templates"} selected
          </p>
        </div>
        <button
          onClick={handleContinueShopping}
          className="inline-flex items-center px-4 py-2 text-slate-700 hover:text-primary-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.templateId} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">
                    {item.template.name}
                  </h3>
                  {item.template.description && (
                    <p className="text-sm text-slate-600 mb-3">{item.template.description}</p>
                  )}

                  {/* Specs */}
                  {item.template.configuration?.compute && (
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                        {item.template.configuration.compute.vcpu} vCPU
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-medium">
                        {Math.round(item.template.configuration.compute.ram_mb / 1024)}GB RAM
                      </span>
                      {item.template.configuration.volumes?.[0] && (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium">
                          {item.template.configuration.volumes[0].size_gb}GB Storage
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="text-xl font-bold text-primary-600">
                    ${(item.template.pricing_cache?.monthly_total_usd || 0) * item.quantity}
                  </div>
                  <div className="text-sm text-slate-600">/month</div>
                </div>
              </div>

              {/* Quantity & Remove */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Quantity:</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.templateId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.templateId, parseInt(e.target.value) || 1)
                      }
                      className="w-12 h-8 text-center border border-slate-300 rounded"
                    />
                    <button
                      onClick={() => updateQuantity(item.templateId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.templateId)}
                  className="inline-flex items-center px-3 py-1.5 text-red-600 hover:bg-red-50 rounded font-medium transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-6">
            <h3 className="font-semibold text-slate-900 text-lg mb-4">Order Summary</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-slate-600">
                <span>Monthly Total:</span>
                <span className="font-semibold">${monthly.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Yearly Total:</span>
                <span className="font-semibold">${yearly.toFixed(2)}</span>
              </div>
              {yearly < monthly * 12 && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Yearly Savings:</span>
                  <span className="font-semibold">${(monthly * 12 - yearly).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 mb-4">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-900 font-semibold">Estimated Cost:</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">${monthly.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">/month</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors mb-3"
            >
              Proceed to Setup
            </button>

            <button
              onClick={() => {
                if (confirm("Clear all items from cart?")) {
                  clearCart();
                }
              }}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors text-sm"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCartPage;
