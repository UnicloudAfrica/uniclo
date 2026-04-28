import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../components/AdminPageShell";
import { ModernButton, ModernInput, ModernCard } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "./api";

export default function TwoFactorPage() {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<"idle" | "enrolling" | "confirming" | "showing-recovery">("idle");
  const [secret, setSecret] = useState<string | null>(null);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const enable = useMutation({
    mutationFn: () => acfApi.enable2FA(),
    onSuccess: (res: Record<string, unknown>) => {
      setSecret(res?.data?.secret ?? res?.secret ?? null);
      setQrUri(res?.data?.qr_uri ?? res?.qr_uri ?? null);
      setPhase("confirming");
    },
  });

  const confirm = useMutation({
    mutationFn: () => acfApi.confirm2FA(code),
    onSuccess: (res: Record<string, unknown>) => {
      setRecoveryCodes(res?.data?.recovery_codes ?? res?.recovery_codes ?? []);
      setPhase("showing-recovery");
      qc.invalidateQueries({ queryKey: ["acf-2fa-status"] });
      ToastUtils.success("Two-factor authentication enabled");
    },
    onError: () => ToastUtils.error("Invalid code — try again"),
  });

  const disable = useMutation({
    mutationFn: () => acfApi.disable2FA(),
    onSuccess: () => {
      ToastUtils.success("2FA disabled");
      setPhase("idle");
      setRecoveryCodes([]);
      setSecret(null);
    },
  });

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    ToastUtils.success("Recovery codes copied");
  };

  return (
    <AdminPageShell
      title="Two-Factor Authentication"
      description="Add an extra layer of security to your AnyCloudFlow account with TOTP."
    >
      <div className="space-y-6 max-w-2xl">
        {phase === "idle" && (
          <ModernCard>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold">2FA is currently disabled</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enabling 2FA will require a 6-digit code from an authenticator app on login.
              </p>
              <div className="flex gap-2">
                <ModernButton onClick={() => enable.mutate()} disabled={enable.isPending}>
                  {enable.isPending ? "Setting up…" : "Enable 2FA"}
                </ModernButton>
                <ModernButton variant="secondary" onClick={() => disable.mutate()}>
                  Disable (if already enabled)
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        )}

        {phase === "confirming" && (
          <ModernCard>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold">Scan this QR code</h3>
              {qrUri && (
                <img
                  alt="2FA QR code"
                  className="w-48 h-48 bg-white p-2"
                  src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(qrUri)}`}
                />
              )}
              <div className="text-sm">
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Or enter this secret manually:
                </p>
                <code className="px-2 py-1 rounded bg-gray-100 dark:bg-[#15203c] break-all">
                  {secret}
                </code>
              </div>
              <ModernInput
                label="6-digit code from your authenticator"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={6}
              />
              <ModernButton
                onClick={() => confirm.mutate()}
                disabled={code.length !== 6 || confirm.isPending}
              >
                {confirm.isPending ? "Verifying…" : "Verify & Enable"}
              </ModernButton>
            </div>
          </ModernCard>
        )}

        {phase === "showing-recovery" && (
          <ModernCard>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                  Save these recovery codes NOW
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  You won't see them again. Use them to log in if you lose access to your authenticator.
                </p>
              </div>
              <pre className="bg-gray-100 dark:bg-[#15203c] p-3 rounded text-sm overflow-x-auto">
                {recoveryCodes.join("\n")}
              </pre>
              <div className="flex gap-2">
                <ModernButton onClick={copyRecoveryCodes}>Copy codes</ModernButton>
                <ModernButton variant="secondary" onClick={() => setPhase("idle")}>
                  Done
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        )}
      </div>
    </AdminPageShell>
  );
}
