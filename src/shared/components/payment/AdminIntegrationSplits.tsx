import { useState } from "react";
import { Plus, CheckCircle, XCircle, Building2, DollarSign, Loader2, Search } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import {
  useFetchIntegrationSplits,
  useCreateIntegrationSplit,
  useFetchBanks,
  useVerifyBankAccount,
  usePreviewSplit,
  type IntegrationSplit,
  type Bank,
} from "@/hooks/paymentSplitHooks";

export default function AdminIntegrationSplits() {
  const { data: splits, isLoading } = useFetchIntegrationSplits();
  const { data: banks } = useFetchBanks();
  const createMutation = useCreateIntegrationSplit();
  const verifyMutation = useVerifyBankAccount();
  const previewMutation = usePreviewSplit();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    integration_key: "",
    business_name: "",
    bank_code: "",
    account_number: "",
    default_share_amount: 0,
    default_share_percentage: 0,
  });
  const [bankSearch, setBankSearch] = useState("");
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [previewAmount, setPreviewAmount] = useState("100");

  const bankList = Array.isArray(banks) ? banks : [];
  const filteredBanks = bankList.filter((b: Bank) => b.name.toLowerCase().includes(bankSearch.toLowerCase()));
  const splitsList = Array.isArray(splits) ? splits : [];

  const handleVerify = () => {
    if (form.account_number.length !== 10 || !form.bank_code) return;
    verifyMutation.mutate(
      { account_number: form.account_number, bank_code: form.bank_code },
      { onSuccess: (data) => setVerifiedName(data?.account_name ?? null) }
    );
  };

  const handleCreate = () => {
    createMutation.mutate(form, {
      onSuccess: () => {
        setShowCreate(false);
        setForm({ integration_key: "", business_name: "", bank_code: "", account_number: "", default_share_amount: 0, default_share_percentage: 0 });
        setVerifiedName(null);
        setBankSearch("");
      },
    });
  };

  const handlePreview = (key: string, share: number) => {
    previewMutation.mutate({
      total_amount: parseFloat(previewAmount),
      integration_key: key,
      integration_cost: share,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
            Integration Payment Splits
          </h3>
          <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>
            Manage Paystack subaccounts for integration partners. Revenue is split automatically when customers pay.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: designTokens.colors.primary[600] }}
        >
          <Plus className="h-4 w-4" />
          Add Integration
        </button>
      </div>

      {/* Existing Splits */}
      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: designTokens.colors.neutral[400] }} /></div>
      ) : splitsList.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor: designTokens.colors.neutral[300] }}>
          <Building2 className="mx-auto mb-3 h-10 w-10" style={{ color: designTokens.colors.neutral[300] }} />
          <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>No integration splits configured yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {splitsList.map((split: IntegrationSplit) => (
            <div key={split.id} className="rounded-xl border bg-white p-5" style={{ borderColor: designTokens.colors.neutral[200] }}>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase" style={{ backgroundColor: designTokens.colors.primary[100], color: designTokens.colors.primary[700] }}>
                  {split.integration_key}
                </span>
                {split.is_verified ? (
                  <CheckCircle className="h-4 w-4" style={{ color: designTokens.colors.success[500] }} />
                ) : (
                  <XCircle className="h-4 w-4" style={{ color: designTokens.colors.error[500] }} />
                )}
              </div>
              <p className="font-semibold" style={{ color: designTokens.colors.neutral[900] }}>{split.name}</p>
              <div className="mt-2 space-y-1 text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                <p>Bank: {split.bank_name || "N/A"}</p>
                <p>Account: {split.account_number || "N/A"}</p>
                <p>Share: {split.split_type === "percentage" ? `${split.default_share_percentage}%` : `$${split.default_share_amount}`}</p>
              </div>
              <button
                onClick={() => handlePreview(split.integration_key, split.default_share_amount)}
                className="mt-3 w-full rounded-lg border py-1.5 text-xs font-medium"
                style={{ borderColor: designTokens.colors.neutral[200], color: designTokens.colors.neutral[600] }}
              >
                Preview Split
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Result */}
      {previewMutation.data && (
        <div className="rounded-xl border bg-white p-5" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <h4 className="mb-3 text-sm font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
            Split Preview (${previewAmount})
          </h4>
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              { label: "Integration", value: previewMutation.data.integration_share, color: designTokens.colors.primary[600] },
              { label: "Tenant", value: previewMutation.data.tenant_share, color: designTokens.colors.warning[600] },
              { label: "Platform", value: previewMutation.data.platform_share, color: designTokens.colors.success[600] },
              { label: "Paystack Fee", value: previewMutation.data.paystack_fee, color: designTokens.colors.error[600] },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border p-3 text-center" style={{ borderColor: designTokens.colors.neutral[100] }}>
                <p className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>{item.label}</p>
                <p className="text-lg font-bold" style={{ color: item.color }}>${item.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border bg-white p-6" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <h4 className="mb-4 text-sm font-semibold" style={{ color: designTokens.colors.neutral[900] }}>Add Integration Partner</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>Integration Key *</label>
              <select
                value={form.integration_key}
                onChange={(e) => setForm({ ...form, integration_key: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: designTokens.colors.neutral[300] }}
              >
                <option value="">Select integration</option>
                <option value="anycloudflow">AnyCloudFlow</option>
                <option value="cuberwatch">CuberWatch</option>
                <option value="cubermail">CuberMail</option>
                <option value="leanploy">LeanPloy</option>
                <option value="staqdb">StaqDB</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>Business Name *</label>
              <input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>Bank *</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: designTokens.colors.neutral[400] }} />
                <input value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} placeholder="Search bank..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} />
              </div>
              {bankSearch && filteredBanks.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border shadow-sm" style={{ borderColor: designTokens.colors.neutral[200] }}>
                  {filteredBanks.slice(0, 8).map((bank: Bank) => (
                    <button key={bank.code} onClick={() => { setForm({ ...form, bank_code: bank.code }); setBankSearch(bank.name); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50">{bank.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>Account Number *</label>
              <div className="flex gap-2">
                <input value={form.account_number} onChange={(e) => { setForm({ ...form, account_number: e.target.value.replace(/\D/g, "").slice(0, 10) }); setVerifiedName(null); }} maxLength={10} className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} />
                <button onClick={handleVerify} disabled={form.account_number.length !== 10 || !form.bank_code} className="rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ backgroundColor: designTokens.colors.primary[600] }}>
                  {verifyMutation.isPending ? "..." : "Verify"}
                </button>
              </div>
              {verifiedName && <p className="mt-1 text-xs font-medium" style={{ color: designTokens.colors.success[600] }}>{verifiedName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>Default Share Amount ($)</label>
              <input type="number" value={form.default_share_amount} onChange={(e) => setForm({ ...form, default_share_amount: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>Or Share Percentage (%)</label>
              <input type="number" value={form.default_share_percentage} onChange={(e) => setForm({ ...form, default_share_percentage: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }}>Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!form.integration_key || !form.business_name || !form.bank_code || !form.account_number || createMutation.isPending}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: designTokens.colors.primary[600] }}
            >
              {createMutation.isPending ? "Creating..." : "Create Integration Split"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
