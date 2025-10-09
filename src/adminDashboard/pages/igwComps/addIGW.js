import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCreateIgw } from "../../../hooks/adminHooks/igwHooks";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";

const AddIgw = ({ isOpen, onClose, projectId, region: defaultRegion = "" }) => {
  const [form, setForm] = useState({ name: "", region: defaultRegion || "" });
  const [errors, setErrors] = useState({});
  const { data: regions, isFetching: isFetchingRegions } = useFetchRegions();
  const { mutate: createIgw, isPending: isCreating } = useCreateIgw();

  useEffect(() => {
    if (defaultRegion && !form.region) {
      setForm((prev) => ({ ...prev, region: defaultRegion }));
    }
  }, [defaultRegion]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.region) e.region = "Region is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    createIgw(
      {
        project_id: projectId,
        region: form.region,
        name: form.name,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[16px] w-full max-w-[520px] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Add Internet Gateway</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={`w-full border rounded px-3 py-2 text-sm ${errors.name ? "border-red-500" : "border-gray-300"}`}
              placeholder="e.g., igw-public"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
              className={`w-full border rounded px-3 py-2 text-sm ${errors.region ? "border-red-500" : "border-gray-300"}`}
              disabled={isFetchingRegions}
            >
              <option value="" disabled>
                {isFetchingRegions ? "Loading regions..." : "Select a region"}
              </option>
              {(regions || []).map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 rounded bg-[#288DD1] text-white text-sm disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIgw;