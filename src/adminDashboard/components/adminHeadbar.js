import { BellRing, CircleHelp } from "lucide-react";
import logo from "./assets/logo.png";

const AdminHeadbar = () => {
  return (
    <div className="w-full fixed top-0 left-0 h-[74px] px-6 md:px-8 py-3 z-[999] border-b bg-[#fff] border-[#C8CBD9] flex justify-between items-center font-Outfit ">
      {/* Logo */}
      <img src={logo} className="w-[71px] h-[54px]" alt="Logo" />

      {/* User Info */}
      <div className="flex items-center space-x-6">
        <BellRing className="text-[#1C1C1C] w-5" />
        <CircleHelp className="text-[#1C1C1C] w-5" />
        <div>
          <p className="text-[#1C1C1C] font-semibold text-sm">
            admin@email.com
          </p>
          <p className="font-normal text-sm text-[#1C1C1C]">Admin</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#1C1C1C33] font-semibold text-sm text-center flex items-center justify-center">
          AD
        </div>
      </div>
    </div>
  );
};

export default AdminHeadbar;
