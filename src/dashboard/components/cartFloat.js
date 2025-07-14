import { useRef, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import CartModal from "../components/cartModal";
import CheckoutModal from "./checkoutModal";
import SuccessModal from "./successModal";
import {
  useFetchCart,
  useUpdateCart,
  useDeleteCart,
  useCheckoutCart,
} from "../../hooks/cartHooks";

const CartFloat = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [checkoutResponse, setCheckoutResponse] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [isHidden, setIsHidden] = useState(false); // ✅ Track dismissed state

  const hasHandledCheckout = useRef(false);

  const { data: cartItems = [], isFetching: cartLoading } = useFetchCart();
  const updateCartMutation = useUpdateCart();
  const deleteCartMutation = useDeleteCart();
  const checkoutMutation = useCheckoutCart();

  const handleCartClick = () => {
    setIsCartOpen(true);
    hasHandledCheckout.current = false;
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const handleUpdateCart = (itemId, newQuantity) => {
    const item = cartItems.find((item) => item.id === itemId);
    if (item) {
      const userData = {
        productable_type: item.productable_type,
        productable_id: item.productable_id,
        quantity: newQuantity,
      };
      updateCartMutation.mutate({ cartID: item.cart_id, userData });
    }
  };

  const handleDeleteItem = (itemId) => {
    const item = cartItems.find((item) => item.id === itemId);
    if (item) {
      const userData = {
        productable_type: item.productable_type,
        productable_id: item.productable_id,
      };
      deleteCartMutation.mutate({ cartID: item.cart_id, userData });
    }
  };

  const handleCheckoutSuccess = (data) => {
    setCheckoutResponse(data);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    hasHandledCheckout.current = true;
  };

  const handlePaymentSuccess = ({ reference, saveCard }) => {
    setTransactionData({ reference, saveCard });
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutResponse(null);
  };

  const handleCloseSuccess = () => {
    setIsSuccessOpen(false);
    setTransactionData(null);
    setCheckoutResponse(null);
  };

  const checkoutProps = {
    onCheckout: () => {
      hasHandledCheckout.current = false;
      checkoutMutation.mutate();
    },
    isCheckoutPending: checkoutMutation.isPending,
    isCheckoutSuccess: checkoutMutation.isSuccess,
    checkoutData: checkoutMutation.data,
    onCheckoutSuccess: handleCheckoutSuccess,
    hasHandledCheckout,
  };

  return (
    <>
      {/* Floating Button */}
      {cartItems.length > 1 && !isHidden && (
        <div className="fixed bottom-6 right-6 z-[1002] hidden items-center gap-2">
          <button
            onClick={handleCartClick}
            className="bg-white shadow-lg py-3 px-5 rounded-full text-sm font-medium flex items-center gap-2 border border-gray-200 hover:shadow-xl transition-all"
            disabled={cartLoading}
          >
            <ShoppingCart className="w-5 h-5 text-[#1C1C1C]" />
            <span className="text-[#1C1C1C]">Cart</span>

            {/* Badge */}
            <span className="ml-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {cartItems.length}
            </span>
          </button>

          {/* Dismiss Button */}
          <button
            onClick={() => setIsHidden(true)}
            className="ml-2 bg-[#F2F2F2] p-2 rounded-full border border-gray-300 hover:bg-[#e0e0e0] transition"
            title="Hide Cart"
          >
            <X className="w-4 h-4 text-[#676767]" />
          </button>
        </div>
      )}

      <CartModal
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cartItems={cartItems}
        updateCartQuantity={handleUpdateCart}
        removeItem={handleDeleteItem}
        isLoading={cartLoading}
        {...checkoutProps}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        checkoutData={checkoutResponse}
        onPaymentSuccess={handlePaymentSuccess}
        goBackToCart={() => {
          setIsCheckoutOpen(false);
          setIsCartOpen(true);
        }}
      />

      <SuccessModal
        isOpen={isSuccessOpen}
        onClose={handleCloseSuccess}
        checkoutData={checkoutResponse}
        transactionData={transactionData}
      />
    </>
  );
};

export default CartFloat;
