import { useState, useEffect, type FormEvent, type MouseEvent } from "react";
import { Loader2, X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateTenantSubnet, useFetchTenantSubnets } from "../../../hooks/subnetHooks";
import { useFetchTenantVpcs, useFetchAvailableCidrs } from "../../../hooks/vpcHooks";
import { useFetchGeneralRegions } from "../../../hooks/resource";
import { useFetchProjectEdgeConfigTenant } from "../../../hooks/edgeHooks";
import logger from "../../../utils/logger";

interface AddSubnetProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | number;
  region?: string;
}

interface SubnetFormData {
  name: string;
  cidr_block: string;
  vpc_id: string;
  region: string;
  description: string;
}

interface VpcOption {
  id?: string | number;
  uuid?: string | number;
  provider_resource_id?: string | number;
  cidr_block?: string;
  cidr?: string;
  network_cidr?: string;
  name?: string;
  identifier?: string;
  [key: string]: unknown;
}

interface ExistingSubnet {
  vpc_id?: string | number;
  network_id?: string | number;
  vpc?: {
    id?: string | number;
  };
  cidr?: string;
  cidr_block?: string;
  [key: string]: unknown;
}

interface RegionOption {
  region: string;
  label: string;
  [key: string]: unknown;
}

interface EdgeConfig {
  edge_network_id?: string | number | null;
  ip_pool_id?: string | number | null;
  [key: string]: unknown;
}

const AddSubnet = ({ isOpen, onClose, projectId, region: defaultRegion = "" }: AddSubnetProps) => {
  const [formData, setFormData] = useState<SubnetFormData>({
    name: "",
    cidr_block: "",
    vpc_id: "",
    region: defaultRegion || "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestPrefix, setSuggestPrefix] = useState(24);

  useEffect(() => {
    if (defaultRegion && !formData.region) {
      setFormData((prev) => ({ ...prev, region: defaultRegion }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultRegion]);

  const { data: regionsRaw, isFetching: isFetchingRegions } = useFetchGeneralRegions();
  const { data: vpcRaw, isFetching: isFetchingVpcs } = useFetchTenantVpcs(
    String(projectId),
    formData["region"],
    { enabled: !!projectId }
  );
  const vpcs: VpcOption[] = Array.isArray((vpcRaw as { data?: unknown })?.data)
    ? (((vpcRaw as { data?: unknown }).data as VpcOption[]) ?? [])
    : Array.isArray(vpcRaw)
      ? (vpcRaw as VpcOption[])
      : [];
  const regions: RegionOption[] = Array.isArray(regionsRaw) ? (regionsRaw as RegionOption[]) : [];

  const { mutate: createSubnet, isPending: isCreating } = useCreateTenantSubnet();

  const { data: edgeConfigRaw, isFetching: isFetchingEdgeConfig } = useFetchProjectEdgeConfigTenant(
    projectId as any,
    formData.region,
    {
      enabled: !!projectId && !!formData["region"],
    }
  );
  const edgeConfig =
    edgeConfigRaw && typeof edgeConfigRaw === "object" ? (edgeConfigRaw as EdgeConfig) : null;

  const { data: existingSubnets = [], isFetching: isFetchingSubnets } = useFetchTenantSubnets(
    projectId as any,
    formData.region,
    {
      enabled: !!projectId && !!formData.region,
    }
  );

  const { data: availableCidrs = [], isFetching: isFetchingAvailableCidrs } =
    useFetchAvailableCidrs(projectId as any, formData.region, formData.vpc_id, suggestPrefix, 8, {
      enabled: !!projectId && !!formData.region && !!formData.vpc_id,
    });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData["name"].trim()) newErrors["name"] = "Subnet name is required";
    if (!formData["vpc_id"]) newErrors["vpc_id"] = "VPC is required";
    if (!formData["region"]) newErrors["region"] = "Region is required";
    if (!formData["cidr_block"].trim()) {
      newErrors["cidr_block"] = "CIDR Block is required";
    } else if (
      !/^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/.test(formData["cidr_block"])
    ) {
      newErrors["cidr_block"] = "Invalid CIDR Block format (e.g., 192.168.1.0/24)";
    }

    // Additional validations
    const selectedVpc = vpcs?.find(
      (v) =>
        String(v["id"] ?? v["uuid"] ?? v["provider_resource_id"]) === String(formData["vpc_id"])
    );
    if (
      selectedVpc &&
      (selectedVpc["cidr_block"] === formData["cidr_block"] ||
        selectedVpc["cidr"] === formData["cidr_block"])
    ) {
      newErrors["cidr_block"] = "Subnet CIDR cannot be the same as the selected VPC CIDR";
    }

    if (
      formData["region"] &&
      (!edgeConfig || !edgeConfig["edge_network_id"] || !edgeConfig["ip_pool_id"])
    ) {
      newErrors["general"] =
        "Edge configuration is missing. Please contact an admin to assign an edge network and IP pool before creating subnets.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: keyof SubnetFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // --- IPv4 helpers ---
  const ipToInt = (ip: string): number =>
    ip.split(".").reduce((acc: number, o: string) => (acc << 8) + (parseInt(o, 10) & 255), 0) >>> 0;
  const intToIp = (n: number): string =>
    [24, 16, 8, 0].map((s: number) => (n >>> s) & 255).join(".");
  const parseCidr = (cidr: string) => {
    const [ip, prefix] = cidr.split("/");
    const p = parseInt(prefix || "0", 10);
    const base = ipToInt(ip || "0.0.0.0") & (p === 0 ? 0 : (~0 << (32 - p)) >>> 0);
    const start = base >>> 0;
    const end = (base + Math.pow(2, 32 - p) - 1) >>> 0;
    return { start, end, prefix: p, base };
  };
  const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
    !(aEnd < bStart || bEnd < aStart);

  const computeSuggestions = () => {
    setSuggestions([]);
    try {
      const selectedVpc = vpcs?.find(
        (v: VpcOption) =>
          String(v.id ?? v.uuid ?? v.provider_resource_id) === String(formData.vpc_id)
      );
      const selectedVpcCidr =
        selectedVpc?.cidr_block || selectedVpc?.cidr || selectedVpc?.network_cidr;
      if (!selectedVpcCidr) return;
      const v = parseCidr(selectedVpcCidr);
      const used: Array<{ start: number; end: number }> = (
        Array.isArray(existingSubnets) ? existingSubnets : ([] as any[])
      )
        .filter(
          (s: ExistingSubnet) =>
            String(s.vpc_id || s.network_id || s.vpc?.id) === String(formData.vpc_id)
        )
        .map((s: ExistingSubnet) => parseCidr(String(s.cidr || s.cidr_block)))
        .sort((a: { start: number }, b: { start: number }) => a.start - b.start);
      const blockSize = Math.pow(2, 32 - suggestPrefix);
      if (suggestPrefix < v.prefix) return; // cannot suggest blocks larger than VPC
      const alignedStart = (v.start + ((blockSize - (v.start % blockSize)) % blockSize)) >>> 0;
      const out: string[] = [];
      for (let cur = alignedStart; cur + blockSize - 1 <= v.end; cur += blockSize) {
        const curEnd = (cur + blockSize - 1) >>> 0;
        // check overlap with any used range
        const hasOverlap = used.some((r: { start: number; end: number }) =>
          overlaps(cur, curEnd, r.start, r.end)
        );
        if (!hasOverlap) {
          out.push(`${intToIp(cur)}/${suggestPrefix}`);
          if (out.length >= 8) break;
        }
      }
      // Merge backend-provided suggestions (if any), preferring locally computed first
      const back = Array.isArray(availableCidrs) ? availableCidrs : [];
      const merged = [
        ...out,
        ...back.filter((r): r is string => typeof r === "string" && !out.includes(r)),
      ];
      setSuggestions(merged);
    } catch (_error_) {
      // swallow; suggestions optional
    }
  };

  const getApiErrorMessage = (error: unknown): string | null => {
    if (!error || typeof error !== "object") return null;
    const payload = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };
    return payload.response?.data?.message ?? null;
  };

  const handleSubmit = (e?: FormEvent | MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      project_id: projectId,
      region: formData["region"],
      name: formData["name"],
      cidr_block: formData["cidr_block"],
      vpc_id: formData["vpc_id"],
      description: formData["description"],
    };

    createSubnet(payload, {
      onSuccess: () => {
        // ToastUtils.success("Subnet created successfully!");
        onClose();
      },
      onError: (error) => {
        logger.error("Failed to create subnet:", error);
        const message = error instanceof Error ? error.message : "Failed to create subnet.";
        try {
          // Fallback if backend attaches message differently
          const apiMsg = getApiErrorMessage(error);
          if (apiMsg) {
            ToastUtils.error(apiMsg);
          } else {
            ToastUtils.error(message);
          }
        } catch (_error_) {
          ToastUtils.error(message);
        }
      },
    });
  };

  // Recompute suggestions when inputs change
  useEffect(() => {
    if (formData.vpc_id && formData.region && !isFetchingSubnets) {
      computeSuggestions();
    } else {
      setSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.vpc_id,
    formData.region,
    suggestPrefix,
    isFetchingSubnets,
    existingSubnets,
    availableCidrs,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[var(--theme-surface-alt)] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[var(--theme-text-color)]">Add New Subnet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[rgb(var(--theme-neutral-900) / 0.7)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          {/* Edge config warning */}
          {formData["region"] &&
            (!edgeConfig || !edgeConfig["edge_network_id"] || !edgeConfig["ip_pool_id"]) && (
              <div className="w-full mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                Edge configuration is missing for this project. Subnet creation is disabled until an
                edge network and IP pool are assigned.
              </div>
            )}
          <div className="space-y-4 w-full">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Subnet Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData["name"]}
                onChange={(e) => updateFormData("name", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors["name"] ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors["name"] && <p className="text-red-500 text-xs mt-1">{errors["name"]}</p>}
            </div>

            <div>
              <label htmlFor="cidr_block" className="block text-sm font-medium text-gray-700 mb-2">
                CIDR Block<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  id="cidr_block"
                  value={formData["cidr_block"]}
                  onChange={(e) => updateFormData("cidr_block", e.target.value)}
                  placeholder="e.g., 10.0.0.0/24"
                  className={`flex-1 rounded-[10px] border px-3 py-2 text-sm input-field ${
                    errors["cidr_block"] ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <div className="flex items-center gap-1 text-xs">
                  <span>Prefix</span>
                  <select
                    value={suggestPrefix}
                    onChange={(e) => setSuggestPrefix(parseInt(e.target.value, 10))}
                    className="border rounded px-2 py-1"
                  >
                    {[20, 21, 22, 23, 24, 25, 26, 27, 28].map((p) => (
                      <option key={p} value={p}>
                        /{p}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={computeSuggestions}
                    className="text-[var(--theme-color)] hover:text-[var(--theme-color)]"
                    title="Compute suggestions"
                  >
                    Suggest
                  </button>
                  {isFetchingAvailableCidrs && (
                    <span className="ml-2 text-gray-500">checking provider…</span>
                  )}
                </div>
              </div>
              {errors["cidr_block"] && (
                <p className="text-red-500 text-xs mt-1">{errors["cidr_block"]}</p>
              )}
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateFormData("cidr_block", s)}
                      className="px-2 py-1 rounded-full border border-[var(--theme-color)] text-[var(--theme-color)] hover:bg-primary-50"
                      title="Use this CIDR"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="vpc_id" className="block text-sm font-medium text-gray-700 mb-2">
                Select VPC<span className="text-red-500">*</span>
              </label>
              <select
                id="vpc_id"
                value={formData["vpc_id"]}
                onChange={(e) => updateFormData("vpc_id", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors["vpc_id"] ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isFetchingVpcs}
              >
                <option value="">{isFetchingVpcs ? "Loading VPCs..." : "Select a VPC"}</option>
                {vpcs?.map((vpc: VpcOption) => {
                  const value = String(vpc.id ?? vpc.uuid ?? vpc.provider_resource_id);
                  const labelCidr = vpc.cidr_block || vpc.cidr || "N/A";
                  return (
                    <option key={value} value={value}>
                      {vpc.name || vpc.identifier || value} ({labelCidr})
                    </option>
                  );
                })}
              </select>
              {errors["vpc_id"] && <p className="text-red-500 text-xs mt-1">{errors["vpc_id"]}</p>}
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                Region<span className="text-red-500">*</span>
              </label>
              <select
                id="region"
                value={formData["region"]}
                onChange={(e) => updateFormData("region", e.target.value)}
                className={`w-full input-field ${
                  errors["region"] ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isFetchingRegions}
              >
                <option value="" disabled>
                  {isFetchingRegions ? "Loading regions..." : "Select a region"}
                </option>
                {regions?.map((region: RegionOption) => (
                  <option key={region.region} value={region.region}>
                    {region.label}
                  </option>
                ))}
              </select>
              {errors["region"] && <p className="text-red-500 text-xs mt-1">{errors["region"]}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData["description"]}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
                className="w-full rounded-[10px] border px-3 py-2 text-sm input-field border-gray-300"
              ></textarea>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[var(--theme-text-color)] bg-[var(--theme-surface-alt)] border border-[var(--theme-surface-alt)] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isCreating ||
                isFetchingVpcs ||
                isFetchingRegions ||
                isFetchingEdgeConfig ||
                !edgeConfig ||
                !edgeConfig["edge_network_id"] ||
                !edgeConfig["ip_pool_id"]
              }
              className="px-8 py-3 bg-[var(--theme-color)] text-white font-medium rounded-[30px] hover:bg-[var(--theme-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create Subnet
              {isCreating && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSubnet;
