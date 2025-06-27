import { useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import CartModal from "../components/cartModal";
import CheckoutModal from "./checkoutModal";
import SuccessModal from "./successModal";
import {
  useFetchCart,
  useUpdateCart,
  useDeleteCart,
  useCheckoutCart,
} from "../../hooks/cartHooks";

const CartButton = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [checkoutResponse, setCheckoutResponse] = useState(null);
  const [transactionData, setTransactionData] = useState(null);

  const hasHandledCheckout = useRef(false); // ✅ Moved here

  const { data: cartItems = [], isFetching: cartLoading } = useFetchCart();
  const updateCartMutation = useUpdateCart();
  const deleteCartMutation = useDeleteCart();
  const checkoutMutation = useCheckoutCart();

  const handleCartClick = () => {
    setIsCartOpen(true);
    hasHandledCheckout.current = false; // ✅ Reset when opening cart
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
      updateCartMutation.mutate({ cartID: item.id, userData });
    }
  };

  const handleDeleteItem = (itemId) => {
    const item = cartItems.find((item) => item.id === itemId);
    if (item) {
      const userData = {
        productable_type: item.productable_type,
        productable_id: item.productable_id,
      };
      deleteCartMutation.mutate({ cartID: item.id, userData });
    }
  };

  const handleCheckoutSuccess = (data) => {
    setCheckoutResponse(data);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    hasHandledCheckout.current = true; // ✅ mark as handled
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
      hasHandledCheckout.current = false; // ✅ Reset before starting checkout
      checkoutMutation.mutate();
    },
    isCheckoutPending: checkoutMutation.isPending,
    isCheckoutSuccess: checkoutMutation.isSuccess,
    checkoutData: checkoutMutation.data,
    onCheckoutSuccess: handleCheckoutSuccess,
    hasHandledCheckout, // ✅ Pass to modal
  };

  return (
    <>
      <button
        onClick={handleCartClick}
        className="bg-white py-2 px-4 rounded-full text-sm font-medium flex items-center relative"
        disabled={cartLoading}
      >
        Cart
        {cartItems.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {cartItems.length}
          </span>
        )}
        <ShoppingCart className="ml-2 w-4" />
      </button>

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

export default CartButton;
