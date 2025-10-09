import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCreateRoute } from "../../../hooks/adminHooks/routeTableHooks";
import { useFetchIgws } from "../../../hooks/adminHooks/igwHooks";
import { useFetchNetworkInterfaces } from "../../../hooks/adminHooks/networkHooks";

const AddRoute = ({ isOpen, onClose, projectId, region: defaultRegion = "", routeTableId = "", routeTables = [] }) => {
  const [form, setForm] = useState({
    region: defaultRegion || "",
    route_table_id: routeTableId || "",
    destination_cidr_block: "0.0.0.0/0",
    target_type: "gateway_id",
    target_id: "",
  });
  const [errors, setErrors] = useState({});
  const { mutate: createRoute, isPending } = useCreateRoute();
  const { data: igws } = useFetchIgws(projectId, form.region, { enabled: !!projectId && !!form.region });
  const { data: enis } = useFetchNetworkInterfaces(projectId, form.region, { enabled: !!projectId && !!form.region });

  useEffect(() => {
    if (defaultRegion && !form.region) setForm((p) => ({ ...p, region: defaultRegion }));
  }, [defaultRegion]);

  useEffect(() => {
    if (routeTableId && !form.route_table_id) setForm((p) => ({ ...p, route_table_id: routeTableId }));
  }, [routeTableId]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.region) e.region = "Region is required";
    if (!form.route_table_id) e.route_table_id = "Route Table ID is required";
    if (!form.destination_cidr_block) e.destination_cidr_block = "Destination CIDR is required";
    if (!form.target_id) e.target_id = "Target ID is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    const payload = {
      project_id: projectId,
      region: form.region,
      route_table_id: form.route_table_id,
      destination_cidr_block: form.destination_cidr_block,
      [form.target_type]: form.target_id,
    };
    createRoute(payload, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[16px] w-full max-w-[560px] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Add Route</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="text-sm text-gray-500">Region: {form.region}</div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Route Table</label>
            <select
              value={form.route_table_id}
              onChange={(e) => setForm((p) => ({ ...p, route_table_id: e.target.value }))}
              className={`w-full border rounded px-3 py-2 text-sm ${errors.route_table_id ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Select Route Table</option>
              {Array.isArray(routeTables) && routeTables.map((rt) => (
                <option key={rt.id || rt.route_table?.id} value={rt.id || rt.route_table?.id}>
                  {rt.name || rt.route_table?.name || (rt.id || rt.route_table?.id)}
                </option>
              ))}
            </select>
            {errors.route_table_id && <p className="text-xs text-red-500 mt-1">{errors.route_table_id}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Destination CIDR</label>
            <input
              type="text"
              value={form.destination_cidr_block}
              onChange={(e) => setForm((p) => ({ ...p, destination_cidr_block: e.target.value }))}
              className={`w-full border rounded px-3 py-2 text-sm ${errors.destination_cidr_block ? "border-red-500" : "border-gray-300"}`}
              placeholder="0.0.0.0/0"
            />
            {errors.destination_cidr_block && <p className="text-xs text-red-500 mt-1">{errors.destination_cidr_block}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Target Type</label>
              <select
                value={form.target_type}
                onChange={(e) => setForm((p) => ({ ...p, target_type: e.target.value, target_id: "" }))}
                className="w-full border rounded px-3 py-2 text-sm border-gray-300"
              >
                <option value="gateway_id">Internet Gateway</option>
                <option value="network_interface_id">Network Interface</option>
                <option value="instance_id">Instance</option>
                <option value="nat_gateway_id">NAT Gateway</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Target ID</label>
              {form.target_type === "gateway_id" ? (
                <select
                  value={form.target_id}
                  onChange={(e) => setForm((p) => ({ ...p, target_id: e.target.value }))}
                  className={`w-full border rounded px-3 py-2 text-sm ${errors.target_id ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select Internet Gateway</option>
                  {(igws || []).map((g) => (
                    <option key={g.id} value={g.id}>{g.name || g.id}</option>
                  ))}
                </select>
              ) : form.target_type === "network_interface_id" ? (
                <select
                  value={form.target_id}
                  onChange={(e) => setForm((p) => ({ ...p, target_id: e.target.value }))}
                  className={`w-full border rounded px-3 py-2 text-sm ${errors.target_id ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select ENI</option>
                  {(enis || []).map((n) => (
                    <option key={n.id || n.network_interface?.id} value={n.id || n.network_interface?.id}>
                      {n.id || n.network_interface?.id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.target_id}
                  onChange={(e) => setForm((p) => ({ ...p, target_id: e.target.value }))}
                  className={`w-full border rounded px-3 py-2 text-sm ${errors.target_id ? "border-red-500" : "border-gray-300"}`}
                  placeholder={form.target_type === 'instance_id' ? 'i-...' : 'nat-...'}
                />
              )}
              {errors.target_id && <p className="text-xs text-red-500 mt-1">{errors.target_id}</p>}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 rounded bg-[#288DD1] text-white text-sm disabled:opacity-50">{isPending ? "Creating..." : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoute;
