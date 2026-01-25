// @ts-nocheck
import React from "react";
import logo from "./assets/logo.png"; // Default logo as fallback
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "../../hooks/useBrandingTheme";
import useImageFallback from "../../hooks/useImageFallback";
import { getSubdomain } from "../../utils/getSubdomain";

const TenantHome = ({ tenant = "Tenant" }: any) => {
  const fallbackBrand = {
    name: tenant,
    logo,
    color: "#288DD1",
  };
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const subdomain = typeof window !== "undefined" ? getSubdomain() : null;
  const { data: branding } = usePublicBrandingTheme({
    domain: hostname,
    subdomain,
  });

  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });

  const accentColor = branding?.accentColor || fallbackBrand.color;
  const accentTint = /^#([0-9A-F]{6}|[0-9A-F]{3})$/i.test(accentColor)
    ? `${accentColor}20`
    : "#288DD120";
  const brandName = branding?.company?.name || fallbackBrand.name;
  const logoSrc = resolveBrandLogo(branding, fallbackBrand.logo);
  const logoAlt = branding?.company?.name
    ? `${branding.company.name} Logo`
    : `${fallbackBrand.name} Logo`;
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(
    logoSrc,
    fallbackBrand.logo
  );

  const shadeColor = (color: any, percent: any) => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.round((R * (100 + percent)) / 100);
    G = Math.round((G * (100 + percent)) / 100);
    B = Math.round((B * (100 + percent)) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    const RR = R.toString(16).length === 1 ? `0${R.toString(16)}` : R.toString(16);
    const GG = G.toString(16).length === 1 ? `0${G.toString(16)}` : G.toString(16);
    const BB = B.toString(16).length === 1 ? `0${B.toString(16)}` : B.toString(16);

    return `#${RR}${GG}${BB}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 font-Outfit bg-gray-50"
      style={{ backgroundColor: accentTint }} // Light background tint of tenant color
    >
      <div className="max-w-md mx-auto w-full bg-white p-6 rounded-xl shadow-md">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <img
            src={resolvedLogoSrc}
            className="w-[80px] mx-auto mb-3 rounded"
            alt={logoAlt}
            onError={handleLogoError}
          />
          <h1 className="text-2xl font-semibold mb-1" style={{ color: accentColor }}>
            Welcome to {brandName}'s Portal
          </h1>
          <p className="text-gray-600 text-sm">Client portal for {brandName}.</p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col space-y-3">
          <a
            href="/sign-in"
            className="w-full bg-[tenantData.color] hover:bg-[shade(tenantData.color, 20%)] text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
            style={{
              backgroundColor: accentColor,
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = shadeColor(accentColor, 20))}
            onMouseOut={(e) => (e.target.style.backgroundColor = accentColor)}
          >
            Login
          </a>
          <a
            href="/sign-up"
            className="w-full border border-[tenantData.color] text-[tenantData.color] hover:bg-[shade(tenantData.color, 90%)] font-medium py-2 px-4 rounded-lg transition-colors text-center"
            style={{
              borderColor: accentColor,
              color: accentColor,
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = accentColor)}
            onMouseOut={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
};

export default TenantHome;
