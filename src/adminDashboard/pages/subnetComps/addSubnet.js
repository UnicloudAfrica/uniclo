import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchTenantVpcs, useFetchAvailableCidrs } from "../../../hooks/vpcHooks";
import { useCreateTenantSubnet, useFetchTenantSubnets } from "../../../hooks/subnetHooks";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";

const AddSubnet = ({ isOpen, onClose, projectId }) => {
  const { data: vpcs, isFetching: isFetchingVpcs } =
    useFetchTenantVpcs(projectId);
  const { data: regions, isFetching: isFetchingRegions } = useFetchRegions();
  const { mutate: createSubnet, isPending: isCreating } =
    useCreateTenantSubnet();
  const { data: existingSubnets, isFetching: isFetchingSubnets } = useFetchTenantSubnets(projectId, formData.region, { enabled: !!projectId && !!formData.region });
  const [suggestions, setSuggestions] = useState([]);
  const [suggestPrefix, setSuggestPrefix] = useState(24);
  const { data: availableCidrs, isFetching: isFetchingAvailableCidrs } = useFetchAvailableCidrs(projectId, formData.region, formData.vpc_id, suggestPrefix, 8, { enabled: !!projectId && !!formData.region && !!formData.vpc_id });

  const [formData, setFormData] = useState({
    name: "",
    cidr_block: "",
    vpc_id: "",
    region: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Subnet name is required";
    if (!formData.vpc_id) newErrors.vpc_id = "VPC is required";
    if (!formData.region) newErrors.region = "Region is required";
    if (!formData.cidr_block.trim()) {
      newErrors.cidr_block = "CIDR Block is required";
    } else if (
      !/^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/.test(
        formData.cidr_block
      )
    ) {
      newErrors.cidr_block = "Invalid CIDR Block format (e.g., 192.168.1.0/24)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // --- IPv4 helpers & suggestions ---
  const ipToInt = (ip) => ip.split(".").reduce((acc, o) => (acc << 8) + (parseInt(o, 10) & 255), 0) >>> 0;
  const intToIp = (n) => [24, 16, 8, 0].map((s) => ((n >>> s) & 255)).join(".");
  const parseCidr = (cidr) => {
    const [ip, prefix] = cidr.split("/");
    const p = parseInt(prefix, 10);
    const base = ipToInt(ip) & (p === 0 ? 0 : (~0 << (32 - p)) >>> 0);
    const start = base >>> 0;
    const end = (base + Math.pow(2, 32 - p) - 1) >>> 0;
    return { start, end, prefix: p, base };
  };
  const overlaps = (aStart, aEnd, bStart, bEnd) => !(aEnd < bStart || bEnd < aStart);

  const computeSuggestions = () => {
    setSuggestions([]);
    try {
      const selectedVpc = vpcs?.find((v) => String(v.id) === String(formData.vpc_id));
      if (!selectedVpc?.cidr_block) return;
      const v = parseCidr(selectedVpc.cidr_block);
      const used = (existingSubnets || [])
        .filter((s) => String(s.vpc_id || s.network_id || s.vpc?.id) === String(formData.vpc_id))
        .map((s) => parseCidr(s.cidr || s.cidr_block))
        .sort((a, b) => a.start - b.start);
      const blockSize = Math.pow(2, 32 - suggestPrefix);
      if (suggestPrefix < v.prefix) return; // cannot suggest blocks larger than VPC
      const alignedStart = (v.start + ((blockSize - (v.start % blockSize)) % blockSize)) >>> 0;
      let out = [];
      for (let cur = alignedStart; cur + blockSize - 1 <= v.end; cur += blockSize) {
        const curEnd = (cur + blockSize - 1) >>> 0;
        const hasOverlap = used.some((r) => overlaps(cur, curEnd, r.start, r.end));
        if (!hasOverlap) {
          out.push(`${intToIp(cur)}/${suggestPrefix}`);
          if (out.length >= 8) break;
        }
      }
      const back = Array.isArray(availableCidrs) ? availableCidrs : [];
      const merged = [...out, ...back.filter((s) => !out.includes(s))];
      setSuggestions(merged);
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    if (formData.vpc_id && formData.region && !isFetchingSubnets) {
      computeSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [formData.vpc_id, formData.region, suggestPrefix, isFetchingSubnets, existingSubnets, availableCidrs]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      project_id: projectId,
      region: formData.region,
      name: formData.name,
      cidr_block: formData.cidr_block,
      vpc_id: formData.vpc_id,
      description: formData.description,
    };

    createSubnet(payload, {
      onSuccess: () => {
        // ToastUtils.success("Subnet created successfully!");
        onClose();
      },
      onError: (error) => {
        console.error("Failed to create subnet:", error);
        // ToastUtils.error(
        //   error.response?.data?.message || "Failed to create subnet."
        // );
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Add New Subnet
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Subnet Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="cidr_block"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                CIDR Block<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  id="cidr_block"
                  value={formData.cidr_block}
                  onChange={(e) => updateFormData("cidr_block", e.target.value)}
                  placeholder="e.g., 10.0.0.0/24"
                  className={`flex-1 rounded-[10px] border px-3 py-2 text-sm input-field ${
                    errors.cidr_block ? "border-red-500" : "border-gray-300"
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
                      <option key={p} value={p}>/{p}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={computeSuggestions}
                    className="text-[#288DD1] hover:text-[#1976D2]"
                    title="Compute suggestions"
                  >
                    Suggest
                  </button>
                  {isFetchingAvailableCidrs && (
                    <span className="ml-2 text-gray-500">checking provider…</span>
                  )}
                </div>
              </div>
              {errors.cidr_block && (
                <p className="text-red-500 text-xs mt-1">{errors.cidr_block}</p>
              )}
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateFormData("cidr_block", s)}
                      className="px-2 py-1 rounded-full border border-[#288DD1] text-[#288DD1] hover:bg-[#E6F2FA]"
                      title="Use this CIDR"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="vpc_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select VPC<span className="text-red-500">*</span>
              </label>
              <select
                id="vpc_id"
                value={formData.vpc_id}
                onChange={(e) => updateFormData("vpc_id", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.vpc_id ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isFetchingVpcs}
              >
                <option value="">
                  {isFetchingVpcs ? "Loading VPCs..." : "Select a VPC"}
                </option>
                {vpcs?.map((vpc) => (
                  <option key={vpc.id} value={vpc.id}>
                    {vpc.name} ({vpc.cidr_block})
                  </option>
                ))}
              </select>
              {errors.vpc_id && (
                <p className="text-red-500 text-xs mt-1">{errors.vpc_id}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Region<span className="text-red-500">*</span>
              </label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => updateFormData("region", e.target.value)}
                className={`w-full input-field ${
                  errors.region ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isFetchingRegions}
              >
                <option value="" disabled>
                  {isFetchingRegions ? "Loading regions..." : "Select a region"}
                </option>
                {regions?.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.region && (
                <p className="text-red-500 text-xs mt-1">{errors.region}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows="3"
                className="w-full rounded-[10px] border px-3 py-2 text-sm input-field border-gray-300"
              ></textarea>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating || isFetchingVpcs || isFetchingRegions}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create Subnet
              {isCreating && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSubnet;
