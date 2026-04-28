import React, { useEffect, useState } from "react";
import { Globe, Search, ShoppingCart, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import DashboardPageShell from "@/shared/layouts/DashboardPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import { api } from "@/lib/api";
import ToastUtils from "@/utils/toastUtil";

/**
 * GAP-034 — domain marketplace (UniCloud port).
 *
 * Two-step flow:
 *   1. Search → /client/domains/quote (price + availability)
 *   2. Purchase → /client/domains/purchase (creates `domain_purchases` row,
 *      calls registrar adapter, returns 201 with the order id)
 *
 * Existing purchases listed at the bottom via /client/domains/purchases.
 *
 * Backend-side, the registrar adapter defaults to `StubDomainRegistrar`
 * so this page works end-to-end in dev without a real Namecheap/Cloudflare
 * key. Production swaps the binding via DOMAIN_REGISTRAR_DRIVER env var.
 */

interface DomainPurchase {
  id: number;
  domain: string;
  registrar: string;
  status: string;
  price_kobo: number;
  years: number;
  expires_at: string | null;
  created_at: string;
}

interface QuoteResponse {
  data: {
    domain: string;
    years: number;
    price_kobo: number | null;
    available: boolean;
  };
}

const formatNaira = (kobo: number): string =>
  `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ClientDomainPurchase: React.FC = () => {
  const [domain, setDomain] = useState("");
  const [years, setYears] = useState(1);
  const [quote, setQuote] = useState<QuoteResponse["data"] | null>(null);
  const [purchases, setPurchases] = useState<DomainPurchase[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  // Contact form state — registrars require WHOIS contact info per ICANN.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("NG");

  const refreshPurchases = async () => {
    try {
      const r = await api.get<{ data: DomainPurchase[] }>("/client/domains/purchases", {
        silent: true,
      });
      setPurchases(r.data ?? []);
    } catch {
      // Silent — list is informational; main flow still works.
    }
  };

  useEffect(() => {
    void refreshPurchases();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = domain.trim().toLowerCase();
    if (!cleaned || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleaned)) {
      ToastUtils.error("Enter a valid domain like example.com");
      return;
    }
    setLoadingQuote(true);
    setQuote(null);
    setShowPurchaseForm(false);
    try {
      const r = await api.get<QuoteResponse>(
        `/client/domains/quote?domain=${encodeURIComponent(cleaned)}&years=${years}`,
        { silent: true },
      );
      setQuote(r.data);
    } catch (err) {
      ToastUtils.error(err instanceof Error ? err.message : "Quote failed");
    } finally {
      setLoadingQuote(false);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || !quote.available) return;
    if (!firstName || !lastName || !email || !address) {
      ToastUtils.error("All contact fields are required.");
      return;
    }
    setPurchasing(true);
    try {
      await api.post("/client/domains/purchase", {
        domain: quote.domain,
        years: quote.years,
        contact: {
          first_name: firstName,
          last_name: lastName,
          email,
          address,
          country,
        },
      });
      ToastUtils.success(`${quote.domain} registered successfully.`);
      setQuote(null);
      setDomain("");
      setShowPurchaseForm(false);
      await refreshPurchases();
    } catch (err) {
      ToastUtils.error(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <DashboardPageShell
      title="Buy a Domain"
      description="Register a new domain and connect it to your services."
      homeHref="/client-dashboard"
      mainClassName="client-dashboard-shell"
    >
      <div className="space-y-6">
        {/* Search */}
        <ModernCard>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Globe className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900">Search for a domain</h3>
                <p className="text-xs text-slate-500">
                  Enter the domain you want to register, including the TLD.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                aria-label="Domain name"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                required
              />
              <select
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                aria-label="Registration period"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {[1, 2, 3, 5, 10].map((y) => (
                  <option key={y} value={y}>
                    {y} year{y === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
              <ModernButton type="submit" loading={loadingQuote}>
                <Search className="mr-1.5 h-4 w-4" />
                Check
              </ModernButton>
            </div>
          </form>
        </ModernCard>

        {/* Quote result */}
        {quote && (
          <ModernCard>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {quote.available ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden="true" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" aria-hidden="true" />
                )}
                <div>
                  <p className="text-base font-semibold text-slate-900">{quote.domain}</p>
                  <p className="text-xs text-slate-500">
                    {quote.available
                      ? `Available — ${formatNaira(quote.price_kobo ?? 0)} for ${quote.years} year${quote.years === 1 ? "" : "s"}`
                      : "Not available — try a different name"}
                  </p>
                </div>
              </div>
              {quote.available && !showPurchaseForm && (
                <ModernButton onClick={() => setShowPurchaseForm(true)}>
                  <ShoppingCart className="mr-1.5 h-4 w-4" />
                  Buy
                </ModernButton>
              )}
            </div>

            {showPurchaseForm && quote.available && (
              <form onSubmit={handlePurchase} className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                <h4 className="text-sm font-medium text-slate-900">WHOIS contact</h4>
                <p className="text-xs text-slate-500">
                  ICANN requires registrants to provide accurate contact info. Used only for
                  registry compliance.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    aria-label="First name"
                    required
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    aria-label="Last name"
                    required
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Contact email"
                    required
                    className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    aria-label="Mailing address"
                    required
                    className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Country (ISO-2, e.g. NG)"
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                    aria-label="Country code"
                    required
                    maxLength={2}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm uppercase focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ModernButton
                    type="button"
                    variant="secondary"
                    onClick={() => setShowPurchaseForm(false)}
                    isDisabled={purchasing}
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton type="submit" loading={purchasing}>
                    Confirm purchase {formatNaira(quote.price_kobo ?? 0)}
                  </ModernButton>
                </div>
              </form>
            )}
          </ModernCard>
        )}

        {/* Existing purchases */}
        <ModernCard>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Your domains</h3>
          {purchases.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No domains purchased yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {purchases.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <a
                      href={`https://${p.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:text-blue-600"
                    >
                      {p.domain}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.registrar} · {p.years} year{p.years === 1 ? "" : "s"} ·{" "}
                      {formatNaira(p.price_kobo)}
                      {p.expires_at && ` · expires ${new Date(p.expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "registered"
                        ? "bg-emerald-100 text-emerald-800"
                        : p.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ModernCard>
      </div>
    </DashboardPageShell>
  );
};

export default ClientDomainPurchase;
