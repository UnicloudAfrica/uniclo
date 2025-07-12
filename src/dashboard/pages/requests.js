import React, { useState } from "react";
import CartFloat from "../components/cartFloat";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import useAuthRedirect from "../../utils/authRedirect";
import ProductForm from "../components/productform";

export default function Requests() {
  const { isLoading } = useAuthRedirect();

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

  return (
    <>
      <CartFloat />
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <p className="text-[#7e7e7e] font-Outfit text-sm font-normal mb-4 -w-3xl">
          Use our configurator to build and price a storage solution by data
          type, capacity, and term.
          <span className=" md:block">
            Once completed, your results will be sent to a team member who will
            contact you with quote.
          </span>
        </p>
        <ProductForm />
      </main>
    </>
  );
}
