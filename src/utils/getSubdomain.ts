// src/utils/getSubdomain.ts
export const getSubdomain = (): string | null => {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  // For unicloudafrica.lvh.me or unicloudafrica.com, return null (public site)
  // For xyz.unicloudafrica.lvh.me or xyz.unicloudafrica.com, return "xyz"
  return parts.length > 2 ? parts[0] : null;
};

export const getBaseDomain = (): string => {
  if (typeof window === "undefined") return "";
  const hostname = window.location.hostname;
  const subdomain = getSubdomain();
  if (!subdomain) return hostname;
  const prefix = `${subdomain}.`;
  return hostname.startsWith(prefix) ? hostname.slice(prefix.length) : hostname;
};
