import { useState } from "react";
import { useFetchRouteTables, useCreateRouteTableAssociation, useDeleteRoute, useCreateRoute } from "../../../hooks/adminHooks/routeTableHooks";
import { useFetchSubnets } from "../../../hooks/adminHooks/subnetHooks";
import { useFetchIgws } from "../../../hooks/adminHooks/igwHooks";
import adminSilentApiforUser from "../../../index/admin/silentadminforuser";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import AddRouteTable from "../routeTableComps/addRouteTable";
import AddRoute from "../routeTableComps/addRoute";

const RouteTables = ({ projectId = "", region = "" }) => {
  const { data: routeTables, isFetching } = useFetchRouteTables(projectId, region);
  const queryClient = useQueryClient();
  const { mutate: associateRouteTable, isPending: associating } = useCreateRouteTableAssociation();
  const { mutate: deleteRoute } = useDeleteRoute();
  const { mutate: createRoute } = useCreateRoute();
  const [assocForm, setAssocForm] = useState({ route_table_id: "", subnet_id: "" });
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [isAddRouteOpen, setAddRouteOpen] = useState(false);
  const [selectedRtId, setSelectedRtId] = useState("");
  const { data: subnets } = useFetchSubnets(projectId, region, { enabled: !!projectId && !!region });
  const { data: igws } = useFetchIgws(projectId, region, { enabled: !!projectId && !!region });

  const handleAssociate = (e) => {
    e.preventDefault();
    if (!assocForm.route_table_id || !assocForm.subnet_id) return;
    associateRouteTable({
      project_id: projectId,
      region,
      route_table_id: assocForm.route_table_id,
      subnet_id: assocForm.subnet_id,
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Route Tables</h2>
          <p className="text-sm text-gray-500">Project: {projectId || "(select)"} {region && `• Region: ${region}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <p className="text-sm text-gray-500">Loading route tables...</p>}
          <button
            onClick={async () => {
              try {
                if (!projectId || !region) return;
                const params = new URLSearchParams();
                params.append("project_id", projectId);
                params.append("region", region);
                params.append("refresh", "1");
                await adminSilentApiforUser("GET", `/business/route-tables?${params.toString()}`);
              } finally {
                queryClient.invalidateQueries({ queryKey: ["routeTables"] });
              }
            }}
            className="flex items-center gap-2 rounded-[30px] py-1.5 px-3 bg-white border text-gray-700 text-xs hover:bg-gray-50"
            title="Refresh from provider"
          >
            <RotateCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Associate form */}
      <div className="p-4 bg-white rounded-lg border flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">Associate Route Table to Subnet</h3>
          <button
            onClick={() => setCreateModal(true)}
            className="rounded-[20px] px-4 py-2 bg-[#288DD1] text-white text-sm"
          >
            Add Route Table
          </button>
        </div>
        <form onSubmit={handleAssociate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="border rounded px-3 py-2"
            value={assocForm.route_table_id}
            onChange={(e) => setAssocForm({ ...assocForm, route_table_id: e.target.value })}
          >
            <option value="">Select Route Table</option>
            {(routeTables || []).map((rt) => (
              <option key={rt.id || rt.route_table?.id} value={rt.id || rt.route_table?.id}>
                {rt.name || rt.route_table?.name || (rt.id || rt.route_table?.id)}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2"
            value={assocForm.subnet_id}
            onChange={(e) => setAssocForm({ ...assocForm, subnet_id: e.target.value })}
          >
            <option value="">Select Subnet</option>
            {(subnets || []).map((sn) => (
              <option key={sn.id} value={sn.id}>
                {sn.name || sn.id} ({sn.cidr || sn.cidr_block})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={associating}
            className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
            title="Associate this route table to the subnet"
          >
            {associating ? "Associating..." : "Associate"}
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        {(routeTables || []).map((rt) => (
          <div key={rt.id || rt.route_table?.id}
               className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{rt.name || rt.route_table?.name || rt.id}</h3>
                <p className="text-xs text-gray-500">ID: {rt.id || rt.route_table?.id}</p>
              </div>
              <div className="text-xs text-gray-600">
                {(rt.vpc_id || rt.route_table?.vpc_id) && (
                  <span>VPC: {rt.vpc_id || rt.route_table?.vpc_id}</span>
                )}
              </div>
            </div>

            {/* Associations */}
            <div className="mt-3">
              <h4 className="text-sm font-semibold">Associations</h4>
              <ul className="text-sm list-disc ml-5">
                {((rt.associations || rt.route_table?.associations) || []).length === 0 && (
                  <li className="text-gray-500">No associations</li>
                )}
                {((rt.associations || rt.route_table?.associations) || []).map((a, i) => (
                  <li key={i}>{a.subnet_id || a.network_id || a}</li>
                ))}
              </ul>
            </div>

            {/* Routes */}
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Routes</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedRtId(rt.id || rt.route_table?.id); setAddRouteOpen(true); }}
                    className="rounded-[16px] px-3 py-1.5 bg-[#288DD1] text-white text-xs"
                  >
                    Add Route
                  </button>
                  <button
                    onClick={() => {
                      const rtId = rt.id || rt.route_table?.id;
                      const vpcId = rt.vpc_id || rt.route_table?.vpc_id;
                      let chosenIgw = null;
                      if (Array.isArray(igws) && igws.length > 0) {
                        chosenIgw = igws.find((g) => (g.attachments?.[0]?.vpc_id || g.vpc_id || g.network_id) === vpcId) || igws[0];
                      }
                      if (!chosenIgw) {
                        console.warn("No Internet Gateway available to create default route");
                        return;
                      }
                      createRoute({
                        project_id: projectId,
                        region,
                        route_table_id: rtId,
                        destination_cidr_block: "0.0.0.0/0",
                        gateway_id: chosenIgw.id,
                      });
                    }}
                    disabled={!igws || igws.length === 0}
                    className="rounded-[16px] px-3 py-1.5 bg-white border text-xs disabled:opacity-50"
                    title="Create default route 0.0.0.0/0 to an Internet Gateway"
                  >
                    Default to IGW
                  </button>
                </div>
              </div>
              <ul className="text-sm list-disc ml-5">
                {((rt.routes || rt.route_table?.routes) || []).length === 0 && (
                  <li className="text-gray-500">No routes</li>
                )}
                {((rt.routes || rt.route_table?.routes) || []).map((r, i) => {
                  const dest = r.destination_cidr_block || r.destination || r.cidr;
                  const rtId = rt.id || rt.route_table?.id;
                  const target = r.gateway_id || r.nat_gateway_id || r.instance_id || r.network_interface_id || null;
                  const payload = {
                    project_id: projectId,
                    region,
                    route_table_id: rtId,
                    destination_cidr_block: dest,
                  };
                  if (r.gateway_id) payload.gateway_id = r.gateway_id;
                  if (r.network_interface_id) payload.network_interface_id = r.network_interface_id;
                  if (r.instance_id) payload.instance_id = r.instance_id;
                  if (r.nat_gateway_id) payload.nat_gateway_id = r.nat_gateway_id;
                  return (
                    <li key={i} className="flex items-center justify-between">
                      <span>
                        {dest} → {target || '—'}
                      </span>
                      <button
                        onClick={() => deleteRoute(payload)}
                        className="text-red-600 text-xs hover:underline"
                        title="Delete route"
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}

        {!isFetching && (!routeTables || routeTables.length === 0) && (
          <p className="text-sm text-gray-500">No Route Tables found for this project.</p>
        )}
      </div>
      <AddRouteTable isOpen={isCreateModalOpen} onClose={() => setCreateModal(false)} projectId={projectId} region={region} />
      <AddRoute isOpen={isAddRouteOpen} onClose={() => setAddRouteOpen(false)} projectId={projectId} region={region} routeTableId={selectedRtId} routeTables={routeTables || []} />
    </div>
  );
};

export default RouteTables;
