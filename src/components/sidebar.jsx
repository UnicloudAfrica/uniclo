import overviewIcon from "./assets/ova.svg";
import settingIcon from "./assets/setting.png";
import solition from "./assets/solution.png";
import career from "./assets/career.png";
import advi from "./assets/advis.png";
import logo from "./assets/logo.svg";
import box from "./assets/box.svg";
import reciept from "./assets/receipt.svg";
import trades from "./assets/trades.svg";
import logout from "./assets/logout.svg";
import { useContext, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { PageContext } from "../contexts/contextprovider";

const Sidebar = () => {
  const [activePage, setActivePage] = useState("General"); // Initially set to the default active page
  const [page, setPage] = useContext(PageContext);

  const Navigate = useNavigate();

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // const analytics = getAnalytics(app);
  const auth = getAuth();

  const pages = [
    { name: "General", icon: settingIcon },
    { name: "Blog", icon: trades },
    { name: "Events", icon: overviewIcon },
    { name: "Resources", icon: box },
    { name: "Solutions", icon: solition },
    { name: "Use-Cases", icon: reciept },
    { name: "Advisory-Board", icon: advi },
    { name: "Career", icon: career },
  ];

  const logOut = () => {
    signOut(auth)
      .then(() => {
        Navigate("/cms-login");
      })
      .catch((error) => {
        console.log("An error happened");
      });
  };

  return (
    <>
      <span className=" absolute top-5 right-4 flex md:hidden items-center">
        <img src={logo} className=" w-12" alt="" />
      </span>
      <div className="fixed top-[80px] left-0 w-[80%] md:w-[100%] h-[100vh] md:border-r pt-6 border-[#00000029]">
        {pages.map((pageItem) => (
          <button
            key={pageItem.name}
            onClick={() => {
              setActivePage(pageItem.name);
              setPage(pageItem.name);
            }}
            className={`w-full pl-8 flex py-[10px] space-x-3 items-center ${
              activePage === pageItem.name
                ? "bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] border-l-[3px] text-[#1e1e1ecc] border-[#3FE0C8CC]"
                : ""
            }`}
          >
            <img src={pageItem.icon} className="w-5 h-5" alt="" />
            <p className="font-Outfit block md:hidden lg:block font-medium text-sm text-[#666666]">
              {pageItem.name}
            </p>
          </button>
        ))}
        <div className="md:absolute bottom-24">
          <button onClick={logOut} className="w-full pl-8 flex py-[10px] space-x-3 items-center">
            <img src={logout} className="w-5 h-5" alt="" />
            <p className="font-Outfit block md:hidden lg:block font-medium text-sm text-[#666666]">
              Logout
            </p>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
