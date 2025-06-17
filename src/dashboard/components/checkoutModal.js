import { X } from "lucide-react";

const CheckoutModal = ({ isOpen, onClose, cartItems }) => {
  if (!isOpen) return null;

  // Calculate total cost from cartItems
  const totalCost = cartItems?.reduce((sum, item) => sum + item.totalAmount, 0);
  const serviceFee = 50000; // Service provisioning fee as ₦50,000
  const totalAmount = totalCost + serviceFee;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
        <div className="bg-white rounded-[24px] w-full max-w-[650px] mx-4">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
            <h2 className="text-lg font-semibold text-[#575758]">Checkout</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[400px] w-full overflow-y-auto">
            <div className="space-y-6">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
                  Payment Method
                </label>
                <span className="w-full px-2 py-4 border border-[#E9EAF4] rounded-[10px] block">
                  <select className=" text-sm text-[#676767]  w-full outline-none">
                    <option value="paystack">Paystack</option>
                    <option value="cards">Cards</option>
                  </select>
                </span>
              </div>

              {/* Amount */}
              <div className=" bg-[#F8F8F8] rounded-lg py-4 px-6">
                <div className=" flex w-full items-center justify-between">
                  <label className="block text-sm font-normal text-[#676767] mb-2">
                    Amount
                  </label>
                  <span className="text-sm font-Outfit font-normal text-[#1c1c1c] block">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className=" flex w-full items-center justify-between">
                  <label className="block text-sm font-normal text-[#676767] mb-2">
                    Service provisioning fee:
                  </label>
                  <span className="text-sm font-Outfit font-normal text-[#1c1c1c] block">
                    ₦{serviceFee.toLocaleString()}
                  </span>
                </div>
                <div className=" flex w-full items-center justify-between">
                  <label className="block text-sm font-normal text-[#676767] mb-2">
                    Payment method:
                  </label>
                  <span className="text-sm font-Outfit font-normal text-[#1c1c1c] block">
                    {cartItems.length > 0 ? "Paystack" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 border-t rounded-b-[24px]">
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
              Proceed
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutModal;
