import React, { useState, useEffect } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import monitor from "./assets/monitor.svg";
import debounce from "lodash/debounce";
import { useEmptyCart } from "../../hooks/cartHooks";

const CartModal = ({
  isOpen,
  onClose,
  cartItems,
  updateCartQuantity,
  removeItem,
  isLoading,
  onCheckout,
  isCheckoutPending,
  isCheckoutSuccess,
  checkoutData,
  onCheckoutSuccess,
  hasHandledCheckout,
}) => {
  const [localQuantities, setLocalQuantities] = useState(
    cartItems.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})
  );
  const { mutate: emptyCart, isPending: isEmptying } = useEmptyCart();
  useEffect(() => {
    setLocalQuantities(
      cartItems.reduce(
        (acc, item) => ({ ...acc, [item.id]: item.quantity }),
        {}
      )
    );
  }, [cartItems]);

  // Handle checkout success to close and trigger parent callback
  useEffect(() => {
    if (isCheckoutSuccess && checkoutData && !hasHandledCheckout.current) {
      onCheckoutSuccess(checkoutData);
      hasHandledCheckout.current = true;
    }
  }, [isCheckoutSuccess, checkoutData, hasHandledCheckout]);

  if (!isOpen) return null;

  const totalCost = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.subtotal || 0),
    0
  );

  const debouncedUpdateQuantity = debounce((itemId, newQuantity) => {
    updateCartQuantity(itemId, newQuantity);
  }, 800);

  const handleQuantityChange = (itemId, change) => {
    const item = cartItems.find((item) => item.id === itemId);
    if (item && !isLoading) {
      const newQuantity = Math.max(
        0,
        (localQuantities[itemId] || item.quantity) + change
      );
      setLocalQuantities((prev) => ({ ...prev, [item.id]: newQuantity }));

      if (newQuantity === 0) {
        removeItem(itemId);
      } else {
        debouncedUpdateQuantity(itemId, newQuantity);
      }
    }
  };

  const getSpecs = (item) => {
    const { productable } = item;
    if (item.productable_type.includes("ComputeInstance")) {
      return `${productable.vcpus} vCPU • ${productable.memory_gib} GiB Memory`;
    } else if (item.productable_type.includes("EbsVolume")) {
      return `${productable.media_type} Storage`;
    }
    return "Unknown Specs";
  };

  const truncateText = (text, maxLength = 25) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] w-full max-w-[650px] mx-4">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 max-h-[400px] w-full overflow-y-auto">
          <div className=" w-full flex items-center justify-between mt-4">
            <button></button>
            <button
              onClick={() => emptyCart()}
              className="px-6 py-2 text-[#EB4178] bg-[#FFF0F4] border border-[#F9CEDA] rounded-[30px] font-medium hover:bg-[#ffe3ec] text-xs md:text-sm transition-colors disabled:opacity-50"
              disabled={isLoading || isEmptying}
            >
              {isEmptying ? (
                <Loader2 className="w-4 h-4 animate-spin inline-block" />
              ) : (
                "Empty Cart"
              )}
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="py-6">
                  <div className="flex flex-row justify-between items-start">
                    <div className="w-2/4">
                      <Skeleton width={200} height={24} />
                      <div className="flex items-center mt-2">
                        <Skeleton width={150} height={16} />
                      </div>
                      <div className="flex mt-3 w-1/4 md:hidden">
                        <Skeleton width={100} height={32} borderRadius={20} />
                      </div>
                    </div>
                    <div className="w-1/4 hidden md:flex">
                      <div className="w-full">
                        <Skeleton width={80} height={16} />
                        <Skeleton
                          width={120}
                          height={32}
                          borderRadius={20}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="w-1/4">
                      <Skeleton width={80} height={16} />
                      <Skeleton width={120} height={24} className="mt-2" />
                      <Skeleton width={120} height={32} className="mt-4" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t py-4 px-6">
                <div className="flex justify-between items-center">
                  <Skeleton width={100} height={24} />
                  <Skeleton width={120} height={24} />
                </div>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Your cart is empty.
            </p>
          ) : (
            <div className="space-y-6 divide-y divide-[#EDEFF6]">
              {cartItems.map((item) => {
                const { productable } = item;
                const title = truncateText(
                  `${productable.name} Compute Instances`,
                  30
                );
                const specs = getSpecs(item);
                const totalAmount = parseFloat(item.subtotal || 0);
                const currentQuantity =
                  localQuantities[item.id] || item.quantity;

                return (
                  <div
                    key={item.id}
                    className="flex flex-row justify-between items-start py-6"
                  >
                    <div className="flex justify-between items-start w-2/4">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#1C1C1C] text-base md:text-lg break-words">
                          {title}
                        </h3>
                        <div className="flex items-center mt-1.5 text-sm text-[#1E1E1EB2] space-x-1.5">
                          <img src={monitor} alt="" />
                          <span className="font-medium text-sm break-words">
                            {specs}
                          </span>
                        </div>
                        <div className="flex md:hidden justify-between items-center mt-3 w-1/4">
                          <div className="flex items-start flex-col">
                            <div className="flex items-center border border-gray-300 mt-2 rounded-[30px] py-2 px-4">
                              <button
                                onClick={() =>
                                  handleQuantityChange(item.id, -1)
                                }
                                className="text-[#1c1c1c] font-normal hover:bg-gray-100 transition-colors"
                                disabled={isLoading}
                              >
                                -
                              </button>
                              <span className="px-4 font-semibold text-sm min-w-[3rem] text-center">
                                {currentQuantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="text-[#1c1c1c] font-normal hover:bg-gray-100 transition-colors"
                                disabled={isLoading}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex justify-between items-center w-1/4">
                      <div className="flex items-start flex-col">
                        <span className="text-sm text-[#1E1E1EB2] font-medium">
                          Number
                        </span>
                        <div className="flex items-center border border-gray-300 mt-2 rounded-[30px] py-2 px-4">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="text-[#1c1c1c] font-normal hover:bg-gray-100 transition-colors"
                            disabled={isLoading}
                          >
                            -
                          </button>
                          <span className="px-4 font-semibold text-sm min-w-[3rem] text-center">
                            {currentQuantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="text-[#1c1c1c] font-normal hover:bg-gray-100 transition-colors"
                            disabled={isLoading}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-left w-1/4">
                      <div className="text-sm text-[#1E1E1EB2] font-medium mb-1">
                        Total Cost
                      </div>
                      <div className="text-xl font-semibold text-[#288DD1] font-Outfit">
                        ₦{totalAmount.toLocaleString()}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#EB4178] text-sm font-medium hover:text-red-600 transition-colors flex items-center whitespace-nowrap mt-6 md:mt-0"
                        disabled={isLoading}
                      >
                        <Trash2 className="text-[#EB4178] w-4 mr-2" />
                        Remove Product
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total Summary - only show if there are items and not loading */}
        {cartItems.length > 0 && !isLoading && (
          <div className="border-t py-4 px-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-[#1C1C1C]">
                Total Cost
              </span>
              <span className="text-2xl font-semibold text-[#288DD1]">
                ₦{totalCost.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
          >
            Close
          </button>

          <button
            onClick={onCheckout}
            className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={cartItems.length === 0 || isLoading || isCheckoutPending}
          >
            {isCheckoutPending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              "Checkout"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
