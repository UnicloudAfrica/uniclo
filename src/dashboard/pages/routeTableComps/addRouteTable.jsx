import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil.ts";
import { useCreateTenantRouteTable } from "../../../hooks/routeTable";
import { useFetchTenantVpcs } from "../../../hooks/vpcHooks";

const AddRouteTableModal = ({ isOpen, onClose, projectId, region: defaultRegion = "" }) => {
  const [form, setForm] = useState({
    name: "",
    vpc_id: "",
    region: defaultRegion || "",
    tags: "",
  });
  const [errors, setErrors] = useState({});

  const { mutate: createRouteTable, isPending } = useCreateTenantRouteTable();

  const { data: vpcRaw, isFetching: isFetchingVpcs } = useFetchTenantVpcs(projectId, form.region, {
    enabled: isOpen && !!projectId,
  });
  const vpcs = useMemo(() => {
    if (Array.isArray(vpcRaw?.data)) return vpcRaw.data;
    if (Array.isArray(vpcRaw)) return vpcRaw;
    return [];
  }, [vpcRaw]);

  useEffect(() => {
    if (defaultRegion && !form.region) {
      setForm((prev) => ({ ...prev, region: defaultRegion }));
    }
  }, [defaultRegion, form.region]);

  if (!isOpen) return null;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.vpc_id) next.vpc_id = "VPC is required";
    if (!form.region) next.region = "Region is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const payload = {
      project_id: projectId,
      region: form.region,
      name: form.name,
      vpc_id: form.vpc_id,
    };
    if (form.tags) {
      payload.tags = form.tags;
    }

    createRouteTable(payload, {
      onSuccess: () => {
        ToastUtils.success("Route table created.");
        onClose();
        setForm((prev) => ({ ...prev, name: "", tags: "" }));
      },
      onError: (err) => {
        console.error("Failed to create route table:", err);
        ToastUtils.error(err?.message || "Failed to create route table.");
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[540px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">Add Route Table</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="rtb-public"
              className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VPC<span className="text-red-500">*</span>
            </label>
            <select
              value={form.vpc_id}
              onChange={(e) => setForm((prev) => ({ ...prev, vpc_id: e.target.value }))}
              className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                errors.vpc_id ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isFetchingVpcs}
            >
              <option value="">{isFetchingVpcs ? "Loading VPCs..." : "Select VPC"}</option>
              {vpcs.map((vpc) => {
                const value = String(vpc.provider_resource_id || vpc.id || vpc.uuid || "");
                return (
                  <option key={value} value={value}>
                    {vpc.name || value} ({vpc.region || "unknown"})
                  </option>
                );
              })}
            </select>
            {errors.vpc_id && <p className="text-xs text-red-500 mt-1">{errors.vpc_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
              placeholder="lagos-1"
              className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                errors.region ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (optional)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="k=v or JSON"
              className="w-full rounded-[10px] border px-3 py-2 text-sm input-field border-gray-300"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            type="button"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Create
            {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRouteTableModal;
