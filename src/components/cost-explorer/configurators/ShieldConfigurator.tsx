import { useMemo, useState } from "react";
import { AlertCircle, Info, Loader2, Plus, Shield } from "lucide-react";
import useCartStore from "@/stores/cartStore";
import { useFetchShieldPlans } from "@/shared/hooks/resources/shieldHooks";
import type { ShieldPlan } from "@/shared/hooks/resources/shieldHooks";

/* ── Fallback options when plans haven't loaded yet ────────────── */

const DEFAULT_PROTECTION_MODES = [
  { id: "standard", label: "Standard", desc: "Basic DDoS + WAF protection" },
  { id: "enhanced", label: "Enhanced", desc: "Advanced WAF rules + bot protection" },
  { id: "enterprise", label: "Enterprise", desc: "Full protection + dedicated support" },
];

const DEFAULT_SSL_TYPES = [
  { id: "lets_encrypt", label: "Auto-Managed (Let's Encrypt)" },
  { id: "custom", label: "Custom Certificate" },
  { id: "dedicated", label: "Dedicated SSL" },
];

/* ── Helpers ────────────────────────────────────────────────────── */

interface OptionItem {
  id: string;
  label: string;
  desc?: string;
}

function buildOptionsFromPlans(
  plans: ShieldPlan[],
  serviceType: string,
  defaults: OptionItem[],
): OptionItem[] {
  const filtered = plans.filter((p) => p.service_type === serviceType);
  if (filtered.length === 0) return defaults;
  return filtered.map((p) => ({
    id: p.integration_key,
    label: p.name,
    desc: p.description,
  }));
}

/* ── Component ──────────────────────────────────────────────────── */

export default function ShieldConfigurator() {
  const addItem = useCartStore((s) => s.addItem);
  const { data: plans, isLoading, isError } = useFetchShieldPlans();

  const protectionModes = useMemo(
    () => buildOptionsFromPlans((plans ?? []) as ShieldPlan[], "protection", DEFAULT_PROTECTION_MODES),
    [plans],
  );
  const sslTypes = useMemo(
    () => buildOptionsFromPlans((plans ?? []) as ShieldPlan[], "ssl", DEFAULT_SSL_TYPES),
    [plans],
  );

  const [mode, setMode] = useState("standard");
  const [ssl, setSsl] = useState("lets_encrypt");
  const [domains, setDomains] = useState(1);
  const [months, setMonths] = useState(1);

  // Ensure selected values stay valid when options change
  const selectedMode = protectionModes.find((m) => m.id === mode) ?? protectionModes[0];
  const selectedSsl = sslTypes.find((s) => s.id === ssl) ?? sslTypes[0];

  /* ── Loading state ──────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading shield plans...
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────── */
  if (isError) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-red-600">
        <AlertCircle className="h-5 w-5" />
        Failed to load shield plans. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
          <Shield className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Shield Protection</h3>
          <p className="text-xs text-gray-500">Web Application Firewall, DDoS mitigation, and SSL management</p>
        </div>
      </div>

      {/* Protection Level */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Protection Level</h4>
        <div className="grid gap-2 sm:grid-cols-3">
          {protectionModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                selectedMode?.id === m.id
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-bold text-gray-900">{m.label}</div>
              {m.desc && <div className="text-[11px] text-gray-500">{m.desc}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* SSL Certificate */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">SSL Certificate</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          {sslTypes.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-xs ${
                selectedSsl?.id === s.id ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="ssl"
                checked={selectedSsl?.id === s.id}
                onChange={() => setSsl(s.id)}
                className="text-red-600"
              />
              <div>
                <div className="font-medium text-gray-900">{s.label}</div>
                {s.desc && <div className="text-gray-500">{s.desc}</div>}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Domain count & duration */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Number of Domains</label>
            <input
              type="number"
              value={domains}
              onChange={(e) => setDomains(Math.max(1, +e.target.value))}
              min={1}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Duration</label>
            <select
              value={months}
              onChange={(e) => setMonths(+e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {[1, 3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {m} {m === 1 ? "month" : "months"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary & Add to Cart */}
      <div className="rounded-xl bg-gradient-to-r from-red-50 to-orange-50 p-5">
        <div className="mb-3 text-sm font-semibold text-gray-700">Configuration Summary</div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Protection</span>
            <span>{selectedMode?.label}</span>
          </div>
          <div className="flex justify-between">
            <span>SSL</span>
            <span>{selectedSsl?.label}</span>
          </div>
          <div className="flex justify-between">
            <span>Domains</span>
            <span>{domains}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration</span>
            <span>{months} {months === 1 ? "month" : "months"}</span>
          </div>
          <div className="flex items-center gap-1 border-t border-red-200 pt-2 text-gray-500">
            <Info className="h-3 w-3 flex-shrink-0" />
            <span>Pricing calculated at checkout</span>
          </div>
        </div>
        <button
          onClick={() =>
            addItem({
              category: "shield",
              name: `Shield ${selectedMode?.label} × ${domains} domain${domains !== 1 ? "s" : ""}`,
              description: `${selectedSsl?.label} SSL, ${months} month${months !== 1 ? "s" : ""}`,
              config: { mode: selectedMode?.id, ssl: selectedSsl?.id, domains, months },
              monthly_cost: 0,
              one_time_cost: 0,
              quantity: 1,
              currency: "NGN",
            })
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
