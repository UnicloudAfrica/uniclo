// src/utils/getSubdomain.js
export const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  // For unicloudafrica.lvh.me or unicloudafrica.com, return null (public site)
  // For xyz.unicloudafrica.lvh.me or xyz.unicloudafrica.com, return "xyz"
  return parts.length > 2 ? parts[0] : null;
};
