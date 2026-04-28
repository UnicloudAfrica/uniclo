import React from "react";
import { AlertCircle, Globe } from "lucide-react";
import adminRegionApi from "@/services/adminRegionApi";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import logger from "@/utils/logger";
import type { VisibilityApprovalCardProps } from "./regionEditTypes";

const VisibilityApprovalCard = ({
  formData,
  setFormData,
  region,
  setRegion,
  submitting: _submitting,
  setSubmitting,
  regionCode,
}: VisibilityApprovalCardProps) => {
  return (
    <ModernCard title="Region Access & Visibility" className="space-y-4">
      <div className="flex gap-4">
        <label
          className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
            formData.visibility === "public" ? "border-blue-500 bg-blue-50" : "border-gray-200"
          }`}
        >
          <input
            type="radio"
            name="visibility"
            value="public"
            checked={formData.visibility === "public"}
            onChange={() => setFormData((p) => ({ ...p, visibility: "public" }))}
            className="sr-only"
          />
          <Globe
            className={`h-5 w-5 ${formData.visibility === "public" ? "text-blue-500" : "text-gray-400"}`}
          />
          <div>
            <p className="font-medium text-gray-900">Public</p>
            <p className="text-xs text-gray-500">Available for new provisioning & access</p>
          </div>
        </label>
        <label
          className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
            formData.visibility === "private" ? "border-amber-500 bg-amber-50" : "border-gray-200"
          }`}
        >
          <input
            type="radio"
            name="visibility"
            value="private"
            checked={formData.visibility === "private"}
            onChange={() => setFormData((p) => ({ ...p, visibility: "private" }))}
            className="sr-only"
          />
          <AlertCircle
            className={`h-5 w-5 ${formData.visibility === "private" ? "text-amber-500" : "text-gray-400"}`}
          />
          <div>
            <p className="font-medium text-gray-900">Private</p>
            <p className="text-xs text-gray-500">
              Restricted to existing resources (No new provisioning)
            </p>
          </div>
        </label>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">Admin Approval Status</span>
            <span className="text-xs text-gray-500">
              Required for any access (public or private).
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              region?.is_verified
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}
          >
            {region?.is_verified ? "Approved" : "Pending Approval"}
          </div>
        </div>
        {!region?.is_verified && (
          <div className="mt-3">
            <ModernButton
              variant="primary"
              size="sm"
              className="w-full"
              onClick={async () => {
                try {
                  await adminRegionApi.verifyRegion(String(region.code));
                  setRegion((prev: unknown) => ({
                    ...prev,
                    is_verified: true,
                    approval_status: "approved",
                  }));
                  ToastUtils.success("Region approved successfully");
                } catch (e) {
                  logger.error(e);
                  ToastUtils.error("Failed to approve region");
                }
              }}
            >
              Approve Region
            </ModernButton>
          </div>
        )}
        {region?.is_verified && (
          <div className="mt-3">
            <ModernButton
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
              onClick={async () => {
                if (
                  globalThis.window.confirm(
                    "Are you sure you want to revoke approval for this region? It will immediately become inaccessible to tenants."
                  )
                ) {
                  try {
                    setSubmitting(true);
                    const res = await adminRegionApi.unverifyRegion(regionCode);
                    if (res.success) {
                      ToastUtils.success("Region approval revoked");
                      setRegion((prev: unknown) => ({
                        ...prev,
                        is_verified: false,
                        approval_status: "pending",
                      }));
                    }
                  } catch (error: unknown) {
                    logger.error("Error revoking region:", error);
                    ToastUtils.error((error instanceof Error ? error.message : String(error)) || "Failed to revoke region");
                  } finally {
                    setSubmitting(false);
                  }
                }
              }}
            >
              Revoke Approval
            </ModernButton>
          </div>
        )}
      </div>
    </ModernCard>
  );
};

export default VisibilityApprovalCard;
