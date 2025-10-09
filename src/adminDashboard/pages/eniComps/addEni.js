import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useFetchVpcs } from "../../../hooks/adminHooks/vcpHooks";
import { useCreateNetworkInterface } from "../../../hooks/adminHooks/networkHooks";

const AddEni = ({ isOpen, onClose, projectId, region: defaultRegion = "" }) => {
  const [form, setForm] = useState({ name: "", network_id: "", region: defaultRegion || "" });
  const [errors, setErrors] = useState({});

  const { data: vpcs } = useFetchVpcs(projectId, form.region, { enabled: !!projectId && !!form.region });
  const { mutate: createEni, isPending } = useCreateNetworkInterface();

  useEffect(() => {
    if (defaultRegion && !form.region) {
      setForm((prev) => ({ ...prev, region: defaultRegion }));
    }
  }, [defaultRegion]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.network_id) e.network_id = "VPC (Network) is required";
    if (!form.region) e.region = "Region is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    createEni(
      {
        project_id: projectId,
        region: form.region,
        network_id: form.network_id,
        ...(form.name ? { name: form.name } : {}),
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[16px] w-full max-w-[560px] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Create Network Interface</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name (optional)</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm border-gray-300"
              placeholder="e.g., eni-web-1"
            />
          </div>

          <div className="text-sm text-gray-500">Region: {form.region}</div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">VPC (Network)</label>
            <select
              value={form.network_id}
              onChange={(e) => setForm((p) => ({ ...p, network_id: e.target.value }))}
              className={`w-full border rounded px-3 py-2 text-sm ${errors.network_id ? "border-red-500" : "border-gray-300"}`}
              disabled={!form.region}
            >
              <option value="" disabled>{!form.region ? "Select region first" : "Select VPC"}</option>
              {(vpcs?.data || vpcs || []).map((v) => (
                <option key={v.id || v.uuid || v.provider_resource_id} value={String(v.id || v.uuid || v.provider_resource_id)}>
                  {v.name || v.identifier || v.id}
                </option>
              ))}
            </select>
            {errors.network_id && <p className="text-xs text-red-500 mt-1">{errors.network_id}</p>}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 rounded bg-[#288DD1] text-white text-sm disabled:opacity-50">
              {isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEni;
