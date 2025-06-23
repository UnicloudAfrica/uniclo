import { useState } from "react";
import ActiveTab from "../components/activeTab";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import { ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
import mobile from "./assets/mobile.svg";
import monitor from "./assets/monitor.svg";
import CartModal from "../components/cartModal";
import CheckoutModal from "../components/checkoutModal";
import SuccessModal from "../components/successModal";

export const Modules = () => {
  const [openItems, setOpenItems] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  // State to control mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const accordionData = [
    {
      id: 1,
      title: "Z2 Compute Instances",
      content: [
        {
          title: "Z2 Large Compute Instances",
          specs: "2 vCPU • 4 GiB Memory",
          price: "₦98,236.80",
          period: "month",
          id: "1-0",
          description: "Ideal for medium-scale processing workloads.",
          icon: mobile,
        },
        {
          title: "Z2 xLarge Compute Instances",
          specs: "4 vCPU • 8 GiB Memory",
          price: "₦196,480.80",
          period: "month",
          id: "1-1",
          description: "Ideal for medium-scale processing workloads.",
          icon: mobile,
        },
        {
          title: "Z2 2xLarge Compute Instances",
          specs: "8 vCPU • 16 GiB Memory",
          price: "₦392,781.60",
          period: "month",
          id: "1-2",
          description: "Ideal for medium-scale processing workloads.",
          icon: mobile,
        },
        {
          title: "Z2 4xLarge Compute Instances",
          specs: "16 vCPU • 32 GiB Memory",
          price: "₦785,916.00",
          period: "month",
          id: "1-3",
          description: "Ideal for medium-scale processing workloads.",
          icon: mobile,
        },
        {
          title: "Z2 8xLarge Compute Instances",
          specs: "32 vCPU • 64 GiB Memory",
          price: "₦1,571,832.00",
          period: "month",
          id: "1-4",
          description: "Ideal for medium-scale processing workloads.",
          icon: mobile,
        },
        {
          title: "Z2 12xLarge Compute Instances",
          specs: "48 vCPU • 96 GiB Memory",
          price: "₦2,356,689.60",
          period: "month",
          id: "1-5",
          description: "Ideal for medium-scale processing workloads.",
          icon: mobile,
        },
      ],
    },
    {
      id: 2,
      title: "Z4 Compute Instances",
      content: [
        {
          title: "Z4 Large Compute Instances",
          specs: "2 vCPU • 8 GiB Memory",
          price: "₦120,000.00",
          period: "month",
          id: "2-0",
          description: "Ideal for medium-scale processing workloads.",
          icon: mobile,
        },
        {
          title: "Z4 xLarge Compute Instances",
          specs: "4 vCPU • 16 GiB Memory",
          price: "₦240,000.00",
          period: "month",
          id: "2-1",
          description: "Ideal for medium-scale processing workloads.",
          icon: mobile,
        },
      ],
    },
    {
      id: 3,
      title: "Z8 Compute Instances",
      content: [
        {
          title: "Z8 xLarge Compute Instances",
          specs: "4 vCPU • 32 GiB Memory",
          price: "₦300,499.20",
          period: "month",
          id: "3-0",
          description: "Ideal for medium-scale processing workloads.",
          icon: mobile,
        },
      ],
    },
    {
      id: 4,
      title: "Shared Storage",
      content: [
        {
          title: "Network Attached Storage",
          specs: "1 TB - 100 TB Capacity",
          price: "₦50,000.00",
          period: "month",
          id: "4-0",
          description: "High-performance shared storage solution.",
          icon: mobile,
        },
      ],
    },
  ];

  const toggleItem = (itemId) => {
    setOpenItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Function to update quantities before adding to cart
  const updateQuantity = (planId, change) => {
    setQuantities((prev) => {
      const currentQty = prev[planId] || 1;
      const newQty = Math.max(1, currentQty + change);
      return {
        ...prev,
        [planId]: newQty,
      };
    });
  };

  // Function to update quantities in the cart
  const updateCartQuantity = (planId, change) => {
    setCartItems((prev) => {
      return prev.map((item) => {
        if (item.id === planId) {
          const newQuantity = Math.max(1, item.quantity + change);
          return {
            ...item,
            quantity: newQuantity,
            totalAmount: item.price * newQuantity,
          };
        }
        return item;
      });
    });
  };

  const addToCart = (plan) => {
    const quantity = quantities[plan.id] || 1;
    const price = parseFloat(plan.price.replace(/[₦,]/g, ""));

    const cartItem = {
      id: plan.id,
      title: plan.title,
      specs: plan.specs,
      price: price,
      quantity: quantity,
      totalAmount: price * quantity,
    };

    setCartItems((prev) => {
      const existingItemIndex = prev.findIndex((item) => item.id === plan.id);
      if (existingItemIndex > -1) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          totalAmount:
            (updatedItems[existingItemIndex].quantity + quantity) * price,
        };
        return updatedItems;
      } else {
        return [...prev, cartItem];
      }
    });

    // Reset quantity after adding to cart
    setQuantities((prev) => ({
      ...prev,
      [plan.id]: 1,
    }));
  };

  const removeItem = (planId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== planId));
  };

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className=" absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%]  bg-[#FAFAFA]  min-h-full p-8">
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-white py-2 px-4 rounded-full text-sm font-medium flex items-center"
        >
          Cart
          <ShoppingCart className="ml-2 w-4" />
        </button>
        <div className=" w-full">
          {/* Cart Debug Info - Remove in production */}
          {cartItems.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                Cart Items ({cartItems.length}):
              </h4>
              {cartItems.map((item, index) => (
                <div key={index} className="text-sm text-green-700 mb-1">
                  {item.title} - Qty: {item.quantity} - Total: ₦
                  {item.totalAmount.toLocaleString()}
                </div>
              ))}
            </div>
          )}

          {accordionData.map((item) => (
            <div
              key={item.id}
              className="border-b border-gray-200 last:border-b-0"
            >
              {/* Header */}
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between py-4 px-0 text-left"
              >
                <span className="text-[#288DD1] font-semibold text-base">
                  {item.title}
                </span>
                <div className="flex items-center text-[#676767] px-3 py-2 text-sm rounded-[8px] bg-[#F2F4F8]">
                  {openItems[item.id] ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span className="ml-2">
                    {openItems[item.id] ? "Close" : "Open"}
                  </span>
                </div>
              </button>

              {/* Collapsible Content */}
              {openItems[item.id] && (
                <div className="pb-4 rounded-md mb-2">
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.content.map((plan, index) => {
                      const currentQuantity = quantities[plan.id] || 1;

                      return (
                        <div
                          className="relative w-full border border-[#E9EAF4] py-6 px-5 rounded-[10px]"
                          key={plan.id}
                        >
                          <div className="max-w-[300px]">
                            <h3 className="text-[#31373D] font-Outfit font-medium text-base">
                              {plan.title}
                            </h3>
                            <div className="flex items-center space-x-2 mt-4">
                              <div className="flex items-center space-x-1">
                                <img src={monitor} className="" alt="" />
                                <p className="font-medium text-sm text-[#1E1E1EB2]">
                                  {plan.specs}
                                </p>
                              </div>
                            </div>
                            <p className="text-[#288DD1] mt-4 text-2xl font-semibold">
                              {plan.price}/{plan.period}
                            </p>
                            <p className="mt-4 text-[#676767] font-normal text-sm">
                              {plan.description}
                            </p>

                            {/* Quantity Selector */}
                            <div className="flex items-center space-x-4 mt-4">
                              <div className="flex items-center border border-gray-300 rounded">
                                <button
                                  onClick={() => updateQuantity(plan.id, -1)}
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                >
                                  -
                                </button>
                                <span className="px-4 py-1 font-medium">
                                  {currentQuantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(plan.id, 1)}
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => addToCart(plan)}
                                className="bg-[#288DD1] text-white rounded-[30px] py-2 px-6 font-normal text-sm hover:bg-[#1976D2] transition-colors"
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>
                          <img
                            src={plan.icon}
                            className=" absolute top-1/3 right-8 md:right-[60px] w-10  md:w-auto"
                            alt=""
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      {/* <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        updateCartQuantity={updateCartQuantity}
        removeItem={removeItem}
      /> */}
      <CheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
      />
      {/* <SuccessModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} /> */}
    </>
  );
};
