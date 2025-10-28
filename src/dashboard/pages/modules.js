import { useState } from "react";
import ActiveTab from "../components/activeTab";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import mobile from "./assets/mobile.svg";
import monitor from "./assets/monitor.svg";
import { useFetchProducts } from "../../hooks/productsHook";
import { SkeletonModules } from "../../utils/skeletonModules";
import { useCreateCart } from "../../hooks/cartHooks";
import CartButton from "../components/cartButton";
import useAuthRedirect from "../../utils/authRedirect";

export const Modules = () => {
  const [openItems, setOpenItems] = useState({});
  const [quantities, setQuantities] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [addingItemId, setAddingItemId] = useState(null); // Track the item being added
  const { data: products, isFetching: isProductsFetching } = useFetchProducts();
  const { mutate: createCart, isPending } = useCreateCart();
  const { isLoading } = useAuthRedirect();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleItem = (itemId) => {
    setOpenItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

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

  const addToCart = (plan) => {
    const quantity = quantities[plan.id] || 1;
    const price = parseFloat(plan.price.replace(/[₦,]/g, ""));

    const cartItem = {
      id: plan.id,
      identifier: plan.identifier || plan.id,
      title: plan.title,
      specs: plan.specs,
      price: price,
      quantity: quantity,
      totalAmount: price * quantity,
    };

    const itemToAdd = {
      productable_type: getProductableType(plan),
      productable_id: plan.identifier || plan.id,
      quantity: quantity,
    };

    // Set the item being added
    setAddingItemId(plan.id);

    // Trigger createCart mutation for the single item
    createCart(
      { items: [itemToAdd] },
      {
        onSuccess: () => {
          console.log("Item added to cart successfully");
          setAddingItemId(null); // Clear the adding item ID on success
        },
        onError: (error) => {
          console.error("Failed to add item to cart:", error);
          setAddingItemId(null); // Clear the adding item ID on error
        },
      }
    );

    // Reset quantity for the plan (moved inside mutation to ensure it happens after)
    setQuantities((prev) => ({
      ...prev,
      [plan.id]: 1,
    }));
  };

  const getProductableType = (plan) => {
    switch (plan.icon) {
      case "mobile":
        return "ComputeInstance";
      case "storage":
        return "EbsVolume";
      default:
        return "ComputeInstance";
    }
  };

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="dashboard-content-shell p-6 md:p-8">
        <CartButton />
        <div className="w-full">
          {isProductsFetching ? (
            <SkeletonModules />
          ) : products?.message ? (
            products.message.map((item) => (
              <div
                key={item.id}
                className="border-b border-gray-200 last:border-b-0"
              >
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

                {openItems[item.id] && (
                  <div className="pb-4 rounded-md mb-2">
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.content.map((plan) => {
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

                              <div className="flex items-center space-x-4 mt-4">
                                <div className="flex items-center border border-gray-300 rounded">
                                  <button
                                    onClick={() => updateQuantity(plan.id, -1)}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                    disabled={isPending}
                                  >
                                    -
                                  </button>
                                  <span className="px-4 py-1 font-medium">
                                    {currentQuantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(plan.id, 1)}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                    disabled={isPending}
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  onClick={() => addToCart(plan)}
                                  className="bg-[#288DD1] text-white rounded-[30px] py-2 px-6 font-normal text-sm hover:bg-[#1976D2] transition-colors flex items-center justify-center"
                                  disabled={isPending}
                                >
                                  {addingItemId === plan.id && isPending ? (
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                  ) : (
                                    "Add to Cart"
                                  )}
                                </button>
                              </div>
                            </div>
                            <img
                              src={mobile}
                              className="absolute top-1/3 right-8 lg:right-[60px] w-10 lg:w-auto"
                              alt=""
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div>No products available</div>
          )}
        </div>
      </main>
    </>
  );
};

export default Modules;
