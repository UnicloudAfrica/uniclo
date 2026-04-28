import { useState } from "react";
import { AlertTriangle, RefreshCw, CheckCircle, Key, Eye, EyeOff } from "lucide-react";
import {
  useCredentialHealth,
  useUpdateCredentials,
  useFetchRegions,
} from "@/hooks/adminHooks/regionHooks";

interface CredentialHealthAlertProps {
  provider?: string;
  regionCode?: string;
}

/**
 * Shows a banner alert when cloud provider credentials are failing.
 * Includes an inline form to update credentials without leaving the page.
 */
const CredentialHealthAlert = ({
  provider = "zadara",
  regionCode = "lagos-1",
}: CredentialHealthAlertProps) => {
  const { data: regions } = useFetchRegions();
  const region = (regions as Array<{ provider?: string; code?: string }> | undefined)?.find(
    (r) => r.provider === provider && r.code === regionCode
  );

  const { data: health, isLoading, refetch } = useCredentialHealth(region?.code);
  const updateMutation = useUpdateCredentials();

  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    domain: "cloud_msp",
  });

  // Don't show if healthy or still loading
  if (isLoading || !health || health.healthy) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!region?.code) return;

    try {
      await updateMutation.mutateAsync({
        regionId: region.code,
        credentials: formData,
      });
      setShowForm(false);
      refetch();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-800 text-sm">Cloud Provider Connection Issue</h4>
          <p className="text-amber-700 text-sm mt-1">
            Unable to connect to {provider}/{regionCode}. Infrastructure operations (VPC, subnets,
            instances) are temporarily unavailable.
            {health.error && <span className="text-amber-600 ml-1">({health.error})</span>}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              Update Credentials
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Re-check
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mt-3 p-3 bg-white rounded-md border border-amber-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder={health.username || "MSP admin username"}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="New password"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-8"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Domain</label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="cloud_msp"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {updateMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Verify & Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                {updateMutation.isError && (
                  <span className="text-xs text-red-500">
                    Verification failed. Check the credentials.
                  </span>
                )}
                {updateMutation.isSuccess && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Credentials updated!
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CredentialHealthAlert;
