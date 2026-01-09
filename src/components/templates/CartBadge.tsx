import React from "react";
import { ShoppingCart } from "lucide-react";
import { useTemplateCart } from "../../stores/templateCartStore";
import { useNavigate } from "react-router-dom";

const CartBadge: React.FC = () => {
  const navigate = useNavigate();
  const count = useTemplateCart((state) => state.getCartCount());

  if (count === 0) return null;

  return (
    <button
      onClick={() => navigate("/client-dashboard/cart")}
      className="relative p-2 text-slate-600 hover:text-primary-600 transition-colors"
      title="View Cart"
    >
      <ShoppingCart className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
};

export default CartBadge;
