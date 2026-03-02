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
import { useContext, useState, type JSX } from "react";
import type { Dispatch, SetStateAction } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { PageContext } from "../contexts/contextprovider";
import {
  lockMarketingTheme,
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "../hooks/useBrandingTheme";
import useImageFallback from "../hooks/useImageFallback";
import { getSubdomain } from "../utils/getSubdomain";

type PageContextValue = [string, Dispatch<SetStateAction<string>>];

const Sidebar = (): JSX.Element => {
  const [activePage, setActivePage] = useState("General"); // Initially set to the default active page
  const [, setPage] = useContext(PageContext) as PageContextValue;
  const hostname = typeof globalThis !== "undefined" ? globalThis.window.location.hostname : "";
  const subdomain = typeof globalThis !== "undefined" ? (getSubdomain() ?? undefined) : undefined;
  const { data: branding } = usePublicBrandingTheme({
    domain: hostname,
    subdomain,
  });
  const lockedBranding = lockMarketingTheme(branding);
  useApplyBrandingTheme(lockedBranding, { fallbackLogo: logo, updateFavicon: true });
  const brandLogoSrc = resolveBrandLogo(lockedBranding, logo);
  const brandLogoAlt = branding?.company?.name
    ? `${branding.company.name} Logo`
    : "UniCloud Africa Logo";
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(brandLogoSrc, logo);

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
  const auth = getAuth(app);

  const pages: Array<{ name: string; icon: string }> = [
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
      .catch(() => {});
  };

  return (
    <>
      <span className=" absolute top-5 right-4 flex md:hidden items-center">
        <img src={resolvedLogoSrc} className=" w-12" alt={brandLogoAlt} onError={handleLogoError} />
      </span>
      <div className="fixed top-[80px] left-0 w-[80%] md:w-[100%] h-[100vh] md:border-r pt-6 border-[rgb(var(--theme-neutral-900) / 0.16)]">
        {pages.map((pageItem) => (
          <button
            key={pageItem.name}
            onClick={() => {
              setActivePage(pageItem.name);
              setPage(pageItem.name);
            }}
            className={`w-full pl-8 flex py-[10px] space-x-3 items-center ${
              activePage === pageItem.name
                ? "bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] border-l-[3px] text-[rgb(var(--theme-neutral-900) / 0.8)] border-[rgb(var(--secondary-color-rgb)/0.8)]"
                : ""
            }`}
          >
            <img src={pageItem.icon} className="w-5 h-5" alt="" />
            <p className="font-Outfit block md:hidden lg:block font-medium text-sm text-[var(--theme-text-color)]">
              {pageItem.name}
            </p>
          </button>
        ))}
        <div className="md:absolute bottom-24">
          <button onClick={logOut} className="w-full pl-8 flex py-[10px] space-x-3 items-center">
            <img src={logout} className="w-5 h-5" alt="" />
            <p className="font-Outfit block md:hidden lg:block font-medium text-sm text-[var(--theme-text-color)]">
              Logout
            </p>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
