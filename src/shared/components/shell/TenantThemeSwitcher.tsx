import React from "react";
import useShellPreferencesStore, {
  type TenantTheme,
} from "@/stores/shellPreferencesStore";
import ToastUtils from "@/utils/toastUtil";

/**
 * Pill-shaped tenant theme dropdown for the headbar.
 *
 * Flips `data-tenant` on `<html>` so the CSS overrides in `index.css`
 * (`[data-tenant="emerald"]`, `[data-tenant="indigo"]`, etc.) re-skin
 * the entire app instantly. Used by superadmin demos and by tenants
 * previewing palettes before committing to a custom brand.
 *
 * The select is hidden below 900px (see `.hb-tenant` rule in `index.css`)
 * because the headbar otherwise runs out of room.
 */

const OPTIONS: { value: TenantTheme; label: string }[] = [
  { value: "default", label: "UniCloud" },
  { value: "emerald", label: "Verdant Cloud" },
  { value: "indigo", label: "Orbit" },
  { value: "sunset", label: "Sahara Stack" },
];

const TenantThemeSwitcher: React.FC = () => {
  const { tenant, setTenant } = useShellPreferencesStore();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as TenantTheme;
    setTenant(next);
    const label = OPTIONS.find((opt) => opt.value === next)?.label ?? next;
    ToastUtils.info(`Theme: ${label}`);
  };

  return (
    <select
      className="hb-tenant"
      value={tenant}
      onChange={handleChange}
      aria-label="Tenant theme"
      style={{
        height: 36,
        padding: "0 12px",
        borderRadius: 9999,
        border: "1px solid var(--theme-border-color)",
        background: "var(--theme-color-10)",
        color: "var(--theme-color)",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default TenantThemeSwitcher;
