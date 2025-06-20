import { Trash2, X } from "lucide-react";
import monitor from "./assets/monitor.svg";

const CartModal = ({
  isOpen,
  onClose,
  cartItems,
  updateCartQuantity,
  removeItem,
}) => {
  if (!isOpen) return null;

  const totalCost = cartItems.reduce((sum, item) => sum + item.totalAmount, 0);

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
          {cartItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Your cart is empty.
            </p>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-  divide-y divide-[#EDEFF6]">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className=" flex flex-row justify-between  items-start py-6"
                  >
                    {/* Item Header */}
                    <div className="flex justify-between items-start w-2/4">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#1C1C1C] text-base md:text-lg">
                          {item.title}
                        </h3>
                        <div className="flex items-center mt-1.5 text-sm text-[#1E1E1EB2] space-x-1.5">
                          <img src={monitor} alt="" />
                          <span className=" font-medium text-sm">
                            {item.specs}
                          </span>
                        </div>
                        {/* Quantity and Price Controls */}
                        <div className="flex md:hidden justify-between items-center mt-3 w-1/4">
                          <div className="flex items-start flex-col">
                            <div className="flex items-center border border-gray-300 mt-2 rounded-[30px] py-2 px-4">
                              <button
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className=" text-[#1c1c1c] font-normal hover:bg-gray-100 transition-colors"
                              >
                                -
                              </button>
                              <span className="px-4  font-semibold text-sm min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(item.id, 1)}
                                className=" text-[#1c1c1c] font-normal hover:bg-gray-100 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity and Price Controls */}
                    <div className=" hidden md:flex justify-between items-center w-1/4">
                      <div className="flex items-start flex-col">
                        <span className="text-sm text-[#1E1E1EB2] font-medium">
                          Number
                        </span>
                        <div className="flex items-center border border-gray-300 mt-2 rounded-[30px] py-2 px-4">
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className=" text-[#1c1c1c] font-normal hover:bg-gray-100 transition-colors"
                          >
                            -
                          </button>
                          <span className="px-4  font-semibold text-sm min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className=" text-[#1c1c1c] font-normal hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-left w-1/4">
                      <div className="text-sm text-[##1E1E1EB2] font-medium mb-1">
                        Total Cost
                      </div>
                      <div className="text-xl font-semibold text-[#288DD1] font-Outfit">
                        ₦{item.totalAmount.toLocaleString()}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#EB4178] text-sm font-medium hover:text-red-600 transition-colors flex items-center whitespace-nowrap mt-6 md:mt-0"
                      >
                        <Trash2 className=" text-[#EB4178] w-4 mr-2 " />
                        Remove Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Total Summary - only show if there are items */}
        {cartItems.length > 0 && (
          <div className="border-t py-4 px-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-[#1C1C1C]">
                Total Cost
              </span>
              <span className="text-2xl font-semibold text-[#288DD1]">
                ₦{totalCost.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className=" grid grid-cols-2 gap-3 items-center px-6 py-4 border-t  rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          <button
            className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={cartItems.length === 0}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
