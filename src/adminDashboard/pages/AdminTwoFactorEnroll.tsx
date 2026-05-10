import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, Smartphone, Copy, Check } from "lucide-react";
import silentApi from "../../index/admin/silent";
import ToastUtils from "@/utils/toastUtil";
import logger from "@/utils/logger";

/**
 * AdminTwoFactorEnroll — onboarding screen for admins forced into 2FA.
 *
 * Routed to by `lib/api.ts` when the backend returns 403 with
 * `two_factor_enrollment_required: true` and scope=admin. Calls the
 * existing /api/v1/2fa-setup → /api/v1/2fa-enable endpoints — these
 * sit under `auth:sanctum` only (NOT '2fa'), so a logged-in admin
 * without a secret can hit them.
 *
 * Flow:
 *   1. GET /api/v1/2fa-setup → returns QR PNG data URL + manual key.
 *   2. User scans QR with TOTP app, enters first 6-digit code.
 *   3. POST /api/v1/2fa-enable with `{ otp }` → backend stores secret.
 *   4. Redirect to /admin-dashboard.
 */
const AdminTwoFactorEnroll = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSetup = async () => {
      setLoading(true);
      try {
        const response = (await silentApi("GET", "/2fa-setup")) as Record<string, unknown>;
        const data = (response?.data ?? response) as Record<string, unknown>;
        // Backend returns `qrCodeSvg` (base64-encoded SVG) and `secret`
        // (Base32 manual key). Render the SVG via a data URI.
        const qrSvg = String(data.qrCodeSvg ?? data.qr_code_svg ?? "");
        setQrUrl(qrSvg ? `data:image/svg+xml;base64,${qrSvg}` : "");
        setManualKey(String(data.secret ?? data.manual_key ?? ""));
      } catch (err) {
        logger.error("Failed to load 2FA setup", err);
        ToastUtils.error("Failed to load 2FA setup. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    loadSetup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      ToastUtils.error("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    setSubmitting(true);
    try {
      const response = (await silentApi("POST", "/2fa-enable", { otp })) as {
        data?: { recovery_codes?: string[] };
      };
      const codes = response?.data?.recovery_codes ?? [];
      ToastUtils.success("Two-factor authentication enabled.");
      if (codes.length > 0) {
        // Show recovery codes screen — user must acknowledge before
        // we navigate them away. Plaintext is shown ONCE.
        setRecoveryCodes(codes);
      } else {
        navigate("/admin-dashboard");
      }
    } catch (err) {
      logger.error("Failed to enable 2FA", err);
      ToastUtils.error("Invalid code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCodes = async () => {
    try {
      await globalThis.navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCopied(true);
      ToastUtils.success("Codes copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      ToastUtils.error("Couldn't access clipboard. Copy manually.");
    }
  };

  const handleFinish = () => {
    if (!recoveryAcknowledged) {
      ToastUtils.error("Please confirm you've saved the recovery codes.");
      return;
    }
    navigate("/admin-dashboard");
  };

  // Step 2: show recovery codes (one-time display)
  if (recoveryCodes.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="bg-emerald-100 rounded-full p-3 mb-3">
              <ShieldCheck className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">2FA enabled. Save these codes.</h1>
            <p className="text-sm text-slate-600 mt-2 max-w-sm">
              These backup codes let you sign in if you lose access to your authenticator app. Each
              code can be used <strong>once</strong>. Store them in a password manager — they will
              not be shown again.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-4 mb-4 font-mono text-sm">
            {recoveryCodes.map((code) => (
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
            className="w-full mb-3 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy all codes"}
          </button>

          <label className="flex items-start gap-2 text-sm text-slate-700 mb-4">
            <input
              type="checkbox"
              checked={recoveryAcknowledged}
              onChange={(e) => setRecoveryAcknowledged(e.target.checked)}
              className="mt-0.5 rounded border-slate-300"
            />
            <span>
              I have saved these recovery codes somewhere safe. I understand they will not be shown
              again.
            </span>
          </label>

          <button
            type="button"
            onClick={handleFinish}
            disabled={!recoveryAcknowledged}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-blue-100 rounded-full p-3 mb-3">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set up two-factor authentication</h1>
          <p className="text-sm text-slate-600 mt-2">
            Your administrator account requires 2FA. Scan the QR code with an authenticator app
            (Google Authenticator, 1Password, Authy) and enter the 6-digit code below.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="2FA QR Code"
                  className="h-48 w-48 rounded-lg border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="h-48 w-48 flex items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
                  No QR code returned
                </div>
              )}
            </div>

            {manualKey && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                  Or enter this key manually
                </p>
                <p className="font-mono text-sm font-medium text-slate-900 break-all">
                  {manualKey}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="otp"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl font-mono tracking-widest focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enabling...
                  </span>
                ) : (
                  "Enable two-factor authentication"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminTwoFactorEnroll;
