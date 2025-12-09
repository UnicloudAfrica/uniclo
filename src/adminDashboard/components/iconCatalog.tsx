// @ts-nocheck
import {
  Building2,
  CircleUserRound,
  Factory,
  Globe2,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

// Central catalogue of semantic icon references used across admin UI.
// Add new keys here to keep iconography consistent between sessions and features.
export const ICON_CATALOG = {
  contact: {
    email: Mail,
    phone: Phone,
    domain: Globe2,
    accountId: ShieldCheck,
  },
  business: {
    companyType: Building2,
    industry: Factory,
    website: LinkIcon,
    registeredAddress: MapPin,
  },
  people: {
    profile: CircleUserRound,
  },
};

export const resolveIcon = (iconKey: any) => {
  if (!iconKey) return null;

  if (typeof iconKey === "function") {
    return iconKey;
  }

  const path = Array.isArray(iconKey) ? iconKey : String(iconKey).split(".");
  return path.reduce((acc, key) => (acc && acc[key] ? acc[key] : null), ICON_CATALOG);
};
