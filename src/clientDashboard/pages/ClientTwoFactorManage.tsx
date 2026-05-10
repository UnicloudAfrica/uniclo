import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, ShieldOff, RotateCcw, AlertTriangle, Copy, Check } from "lucide-react";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import silentApi from "../../index/silent";
import api from "../../index/api";
import ToastUtils from "@/utils/toastUtil";
import logger from "@/utils/logger";

/**
 * ClientTwoFactorManage — self-service 2FA management for clients.
 *
 * Mirror of `AdminTwoFactorManage` / `TenantTwoFactorManage`. Uses the
 * central api (silentApi/api) which routes through `/api/v1/2fa-*`,
 * matching where clients hit by default.
 */
type StatusResponse = { data: { two_factor_enabled: boolean; recovery_codes_remaining: number } };
type RegenerateResponse = { data: { recovery_codes: string[] } };

const ClientTwoFactorManage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [codesRemaining, setCodesRemaining] = useState(0);
  const [mode, setMode] = useState<"none" | "disable" | "regenerate">("none");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = (await silentApi("GET", "/2fa-recovery-codes")) as StatusResponse;
      setTwoFactorEnabled(res.data.two_factor_enabled);
      setCodesRemaining(res.data.recovery_codes_remaining);
    } catch (err) {
      logger.error("Failed to load 2FA status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const closeModal = () => {
    setMode("none");
    setOtp("");
  };

  const handleDisable = async () => {
    if (!otp.trim()) {
      ToastUtils.error("Enter your authenticator code or a recovery code.");
      return;
    }
    setSubmitting(true);
    try {
      await api("POST", "/2fa-disable", { otp });
      ToastUtils.success("Two-factor authentication disabled.");
      closeModal();
      loadStatus();
    } catch (err) {
      logger.error("Failed to disable 2FA", err);
      ToastUtils.error("Invalid code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!/^\d{6}$/.test(otp)) {
      ToastUtils.error("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setSubmitting(true);
    try {
      const res = (await api("POST", "/2fa-recovery-codes/regenerate", {
        otp,
      })) as RegenerateResponse;
      const codes = res?.data?.recovery_codes ?? [];
      ToastUtils.success("Recovery codes regenerated. Old codes are now invalid.");
      setNewCodes(codes);
      setOtp("");
      setMode("none");
      loadStatus();
    } catch (err) {
      logger.error("Failed to regenerate recovery codes", err);
      ToastUtils.error("Invalid code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCodes = async () => {
    try {
      await globalThis.navigator.clipboard.writeText(newCodes.join("\n"));
      setCopied(true);
      ToastUtils.success("Codes copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      ToastUtils.error("Couldn't access clipboard. Copy manually.");
    }
  };

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Two-factor authentication"
        description="Manage 2FA on your account, regenerate backup codes, or disable 2FA."
        contentClassName="space-y-6"
      >
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !twoFactorEnabled ? (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center space-y-3">
          <ShieldOff className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-sm text-slate-600">
            Two-factor authentication is not currently enabled on this account.
          </p>
          <Link
            to="/client-2fa-enroll"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Enable 2FA
          </Link>
        </section>
      ) : (
        <>
          <section className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="text-base font-semibold text-slate-900">2FA is active</p>
                <p className="text-xs text-slate-500">
                  {codesRemaining} recovery code{codesRemaining === 1 ? "" : "s"} remaining
                </p>
              </div>
            </div>
            {codesRemaining <= 3 && codesRemaining > 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  You have {codesRemaining} recovery code{codesRemaining === 1 ? "" : "s"} left.
                  Regenerate now to refill the batch.
                </p>
              </div>
            )}
            {codesRemaining === 0 && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 flex gap-2 text-sm text-red-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>No recovery codes remaining. Regenerate to avoid being locked out.</p>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Recovery codes</h2>
            <p className="text-sm text-slate-600">
              Generate a fresh batch of 10 backup codes. Old codes will become invalid.
            </p>
            <button
              type="button"
              onClick={() => setMode("regenerate")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Regenerate recovery codes
            </button>
          </section>

          <section className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm space-y-3">
            <h2 className="text-base font-semibold text-red-700">Disable 2FA</h2>
            <p className="text-sm text-slate-600">
              Removes 2FA from your account. Recovery codes will also be wiped.
            </p>
            <button
              type="button"
              onClick={() => setMode("disable")}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <ShieldOff className="h-4 w-4" />
              Disable two-factor authentication
            </button>
          </section>
        </>
      )}

      {newCodes.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">New recovery codes</h2>
            <p className="text-sm text-slate-600 mb-4">
              Save these somewhere safe — they will not be shown again. Old codes are now invalid.
            </p>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-4 mb-4 font-mono text-sm">
              {newCodes.map((code) => (
                <div
                  key={code}
                  className="bg-white rounded border border-slate-200 px-3 py-2 text-center text-slate-900"
                >
                  {code}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCopyCodes}
              className="w-full mb-2 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy all codes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNewCodes([]);
                navigate("/client-dashboard/security/2fa");
              }}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {mode !== "none" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {mode === "disable" ? "Disable 2FA" : "Regenerate codes"}
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              {mode === "disable"
                ? "Enter the 6-digit code from your authenticator app, OR a recovery code (xxxx-xxxx), to confirm."
                : "Enter the 6-digit code from your authenticator app to generate new recovery codes."}
            </p>
            <input
              type="text"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 32))}
              placeholder={mode === "disable" ? "123456 or xxxx-xxxx" : "123456"}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center font-mono text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={mode === "disable" ? handleDisable : handleRegenerate}
                disabled={submitting || otp.length === 0}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                  mode === "disable" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting ? "Working..." : mode === "disable" ? "Disable" : "Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
      </ClientPageShell>
    </>
  );
};

export default ClientTwoFactorManage;
