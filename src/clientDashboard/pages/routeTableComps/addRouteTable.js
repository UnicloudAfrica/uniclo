import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useFetchClientVpcs } from "../../../hooks/clientHooks/vpcHooks";
import { useCreateClientRouteTable } from "../../../hooks/clientHooks/routeTableHooks";

const AddRouteTable = ({
  isOpen,
  onClose,
  projectId,
  region: defaultRegion = "",
}) => {
  const [form, setForm] = useState({
    name: "",
    vpc_id: "",
    region: defaultRegion || "",
    tags: "",
  });
  const [errors, setErrors] = useState({});

  const { data: vpcs } = useFetchClientVpcs(projectId, form.region, {
    enabled: !!projectId && !!form.region,
  });
  const { mutate: createRouteTable, isPending } = useCreateClientRouteTable();

  useEffect(() => {
    if (defaultRegion && !form.region) {
      setForm((prev) => ({ ...prev, region: defaultRegion }));
    }
  }, [defaultRegion, form.region]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.vpc_id) e.vpc_id = "VPC is required";
    if (!form.region) e.region = "Region is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    createRouteTable(
      {
        project_id: projectId,
        region: form.region,
        name: form.name,
        vpc_id: form.vpc_id,
        ...(form.tags ? { tags: form.tags } : {}),
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  const vpcList = Array.isArray(vpcs?.data)
    ? vpcs.data
    : Array.isArray(vpcs)
    ? vpcs
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[16px] w-full max-w-[560px] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Add Route Table
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              className={`w-full border rounded px-3 py-2 text-sm ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., rtb-public"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div className="text-sm text-gray-500">Region: {form.region}</div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">VPC</label>
            <select
              value={form.vpc_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, vpc_id: e.target.value }))
              }
              className={`w-full border rounded px-3 py-2 text-sm ${
                errors.vpc_id ? "border-red-500" : "border-gray-300"
              }`}
              disabled={!form.region}
            >
              <option value="" disabled>
                {!form.region ? "Select region first" : "Select VPC"}
              </option>
              {vpcList.map((v) => (
                <option
                  key={v.id || v.uuid || v.provider_resource_id}
                  value={String(v.id || v.uuid || v.provider_resource_id)}
                >
                  {v.name || v.identifier || v.id}
                </option>
              ))}
            </select>
            {errors.vpc_id && (
              <p className="text-xs text-red-500 mt-1">{errors.vpc_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Tags (optional)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) =>
                setForm((p) => ({ ...p, tags: e.target.value }))
              }
              className="w-full border rounded px-3 py-2 text-sm border-gray-300"
              placeholder="any string or JSON"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded bg-[#288DD1] text-white text-sm disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRouteTable;
