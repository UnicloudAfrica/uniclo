import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import AdminPageShell from "../../../components/AdminPageShell";
import { ModernButton, ModernInput, ModernCard } from "@/shared/components/ui";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "./api";

export default function ApiKeyRotationPage() {
  const [identifier, setIdentifier] = useState("");
  const [gracePeriod, setGracePeriod] = useState("24");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const rotate = useMutation({
    mutationFn: () => acfApi.rotateApiKey(identifier, parseInt(gracePeriod, 10) || 24),
    onSuccess: (res: Record<string, unknown>) => {
      setNewKey(res?.data?.key ?? res?.key ?? null);
      ToastUtils.success("Key rotated — copy the new key now");
      setConfirming(false);
    },
    onError: () => ToastUtils.error("Rotation failed"),
  });

  return (
    <AdminPageShell
      title="Rotate API Key"
      description="Rotate an AnyCloudFlow API key with a grace period for the old key to remain valid."
    >
      <div className="space-y-4 max-w-xl">
        <ModernCard>
          <div className="p-6 space-y-4">
            <ModernInput
              label="API key identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="key_abc123..."
            />
            <ModernInput
              label="Grace period (hours)"
              type="number"
              min={1}
              max={168}
              value={gracePeriod}
              onChange={(e) => setGracePeriod(e.target.value)}
              helper="Old key remains valid for this many hours after rotation. Max 168 (7 days)."
            />
            <ModernButton
              variant="danger"
              disabled={!identifier || rotate.isPending}
              onClick={() => setConfirming(true)}
            >
              Rotate key
            </ModernButton>
          </div>
        </ModernCard>

        {newKey && (
          <ModernCard>
            <div className="p-6 space-y-3">
              <p className="font-semibold text-yellow-700">
                Copy this key now — it will not be shown again.
              </p>
              <pre className="bg-gray-100 dark:bg-[#15203c] p-3 rounded overflow-x-auto text-sm">
                {newKey}
              </pre>
              <ModernButton
                onClick={() => {
                  navigator.clipboard.writeText(newKey);
                  ToastUtils.success("Copied");
                }}
              >
                Copy to clipboard
              </ModernButton>
            </div>
          </ModernCard>
        )}

        {confirming && (
          <ConfirmDialog
            isOpen={true}
            title="Rotate this API key?"
            message={`The old key will keep working for ${gracePeriod} hour(s). After that it stops working — update your integrations before then.`}
            confirmLabel="Yes, rotate"
            variant="danger"
            onConfirm={() => rotate.mutate()}
            onCancel={() => setConfirming(false)}
          />
        )}
      </div>
    </AdminPageShell>
  );
}
