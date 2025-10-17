import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateTenantRoute } from "../../../hooks/routeTable";
import { useFetchTenantInternetGateways } from "../../../hooks/internetGatewayHooks";
import { useFetchTenantNetworkInterfaces } from "../../../hooks/eni";

const AddRouteModal = ({
  isOpen,
  onClose,
  projectId,
  region: defaultRegion = "",
  routeTableId = "",
  routeTables = [],
}) => {
  const [form, setForm] = useState({
    region: defaultRegion || "",
    route_table_id: routeTableId || "",
    destination_cidr_block: "0.0.0.0/0",
    target_type: "gateway_id",
    target_id: "",
  });
  const [errors, setErrors] = useState({});

  const { mutate: createRoute, isPending } = useCreateTenantRoute();
  const { data: igwsRaw, isFetching: isFetchingIgws } =
    useFetchTenantInternetGateways(projectId, form.region, {
      enabled: isOpen && !!projectId && !!form.region,
    });
  const { data: enisRaw, isFetching: isFetchingEnis } =
    useFetchTenantNetworkInterfaces(projectId, form.region, {
      enabled: isOpen && !!projectId && !!form.region,
    });

  const igws = useMemo(() => igwsRaw || [], [igwsRaw]);
  const enis = useMemo(() => enisRaw || [], [enisRaw]);

  useEffect(() => {
    if (defaultRegion && !form.region) {
      setForm((prev) => ({ ...prev, region: defaultRegion }));
    }
  }, [defaultRegion, form.region]);

  useEffect(() => {
    if (routeTableId && !form.route_table_id) {
      setForm((prev) => ({ ...prev, route_table_id: routeTableId }));
    }
  }, [routeTableId, form.route_table_id]);

  if (!isOpen) return null;

  const validate = () => {
    const next = {};
    if (!form.region) next.region = "Region is required";
    if (!form.route_table_id) next.route_table_id = "Route table is required";
    if (!form.destination_cidr_block)
      next.destination_cidr_block = "CIDR is required";
    if (!form.target_id) next.target_id = "Target is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const payload = {
      project_id: projectId,
      region: form.region,
      route_table_id: form.route_table_id,
      destination_cidr_block: form.destination_cidr_block,
    };

    if (form.target_type === "gateway_id") {
      payload.gateway_id = form.target_id;
    } else if (form.target_type === "network_interface_id") {
      payload.network_interface_id = form.target_id;
    } else if (form.target_type === "instance_id") {
      payload.instance_id = form.target_id;
    } else if (form.target_type === "nat_gateway_id") {
      payload.nat_gateway_id = form.target_id;
    }

    createRoute(payload, {
      onSuccess: () => {
        ToastUtils.success("Route added.");
        onClose();
      },
      onError: (err) => {
        console.error("Failed to create route:", err);
        ToastUtils.error(err?.message || "Failed to create route.");
      },
    });
  };

  const renderTargetSelect = () => {
    if (form.target_type === "gateway_id") {
      return (
        <select
          value={form.target_id}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, target_id: e.target.value }))
          }
          className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
            errors.target_id ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">
            {isFetchingIgws ? "Loading IGWs..." : "Select Internet Gateway"}
          </option>
          {igws.map((g) => {
            const value =
              g.provider_resource_id || g.id || g.uuid || g.name || "";
            return (
              <option key={value} value={value}>
                {g.name || value}
              </option>
            );
          })}
        </select>
      );
    }

    if (form.target_type === "network_interface_id") {
      return (
        <select
          value={form.target_id}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, target_id: e.target.value }))
          }
          className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
            errors.target_id ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">
            {isFetchingEnis ? "Loading ENIs..." : "Select Network Interface"}
          </option>
          {enis.map((eni) => {
            const value =
              eni.provider_resource_id || eni.id || eni.uuid || eni.name || "";
            return (
              <option key={value} value={value}>
                {value}
              </option>
            );
          })}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={form.target_id}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, target_id: e.target.value }))
        }
        placeholder={
          form.target_type === "instance_id" ? "Instance ID" : "NAT Gateway ID"
        }
        className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
          errors.target_id ? "border-red-500" : "border-gray-300"
        }`}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[560px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">Add Route</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.region}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, region: e.target.value }))
                }
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.region ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.region && (
                <p className="text-xs text-red-500 mt-1">{errors.region}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Table<span className="text-red-500">*</span>
              </label>
              <select
                value={form.route_table_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    route_table_id: e.target.value,
                  }))
                }
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.route_table_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Route Table</option>
                {(routeTables || []).map((rt) => {
                  const id = rt.provider_resource_id || rt.id || "";
                  return (
                    <option key={id} value={id}>
                      {rt.name || id}
                    </option>
                  );
                })}
              </select>
              {errors.route_table_id && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.route_table_id}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination CIDR<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.destination_cidr_block}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  destination_cidr_block: e.target.value,
                }))
              }
              placeholder="0.0.0.0/0"
              className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                errors.destination_cidr_block
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.destination_cidr_block && (
              <p className="text-xs text-red-500 mt-1">
                {errors.destination_cidr_block}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Type
              </label>
              <select
                value={form.target_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    target_type: e.target.value,
                    target_id: "",
                  }))
                }
                className="w-full rounded-[10px] border px-3 py-2 text-sm input-field border-gray-300"
              >
                <option value="gateway_id">Internet Gateway</option>
                <option value="network_interface_id">Network Interface</option>
                <option value="instance_id">Instance</option>
                <option value="nat_gateway_id">NAT Gateway</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target<span className="text-red-500">*</span>
              </label>
              {renderTargetSelect()}
              {errors.target_id && (
                <p className="text-xs text-red-500 mt-1">{errors.target_id}</p>
              )}
            </div>
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
            Add Route
            {isPending && (
              <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRouteModal;
