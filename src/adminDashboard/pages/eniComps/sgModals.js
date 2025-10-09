import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAttachNetworkInterfaceSecurityGroup, useDetachNetworkInterfaceSecurityGroup } from "../../../hooks/adminHooks/networkHooks";
import { useFetchSecurityGroups } from "../../../hooks/adminHooks/securityGroupHooks";

export const AttachSgModal = ({ isOpen, onClose, projectId, region = "", networkInterfaceId = "" }) => {
  const [form, setForm] = useState({ security_group_id: "", region, network_interface_id: networkInterfaceId });
  const [errors, setErrors] = useState({});
  const { mutate: attach, isPending } = useAttachNetworkInterfaceSecurityGroup();
  const { data: securityGroups } = useFetchSecurityGroups(projectId, form.region, { enabled: !!projectId && !!form.region });

  useEffect(() => {
    setForm((p) => ({ ...p, region, network_interface_id: networkInterfaceId }));
  }, [region, networkInterfaceId]);

  if (!isOpen) return null;

  const submit = (e) => {
    if (e) e.preventDefault();
    const eobj = {};
    if (!form.region) eobj.region = "Region is required";
    if (!form.security_group_id) eobj.security_group_id = "Security Group ID is required";
    if (!form.network_interface_id) eobj.network_interface_id = "ENI ID is required";
    setErrors(eobj);
    if (Object.keys(eobj).length) return;
    attach({ project_id: projectId, region: form.region, network_interface_id: form.network_interface_id, security_group_id: form.security_group_id }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[16px] w-full max-w-[520px] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Attach Security Group</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Region</label>
            <input value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} className={`w-full border rounded px-3 py-2 text-sm ${errors.region ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">ENI ID</label>
            <input value={form.network_interface_id} onChange={(e) => setForm((p) => ({ ...p, network_interface_id: e.target.value }))} className={`w-full border rounded px-3 py-2 text-sm ${errors.network_interface_id ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.network_interface_id && <p className="text-xs text-red-500 mt-1">{errors.network_interface_id}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Security Group</label>
            <select
              value={form.security_group_id}
              onChange={(e) => setForm((p) => ({ ...p, security_group_id: e.target.value }))}
              className={`w-full border rounded px-3 py-2 text-sm ${errors.security_group_id ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select Security Group</option>
              {(securityGroups || []).map((sg) => (
                <option key={sg.id} value={sg.id}>{sg.name || sg.id}</option>
              ))}
            </select>
            {errors.security_group_id && <p className="text-xs text-red-500 mt-1">{errors.security_group_id}</p>}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 rounded bg-[#288DD1] text-white text-sm disabled:opacity-50">{isPending ? 'Attaching...' : 'Attach'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DetachSgModal = ({ isOpen, onClose, projectId, region = "", networkInterfaceId = "" }) => {
  const [form, setForm] = useState({ security_group_id: "", region, network_interface_id: networkInterfaceId });
  const [errors, setErrors] = useState({});
  const { mutate: detach, isPending } = useDetachNetworkInterfaceSecurityGroup();
  const { data: securityGroups } = useFetchSecurityGroups(projectId, form.region, { enabled: !!projectId && !!form.region });

  useEffect(() => {
    setForm((p) => ({ ...p, region, network_interface_id: networkInterfaceId }));
  }, [region, networkInterfaceId]);

  if (!isOpen) return null;

  const submit = (e) => {
    if (e) e.preventDefault();
    const eobj = {};
    if (!form.region) eobj.region = "Region is required";
    if (!form.security_group_id) eobj.security_group_id = "Security Group ID is required";
    if (!form.network_interface_id) eobj.network_interface_id = "ENI ID is required";
    setErrors(eobj);
    if (Object.keys(eobj).length) return;
    detach({ project_id: projectId, region: form.region, network_interface_id: form.network_interface_id, security_group_id: form.security_group_id }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[16px] w-full max-w-[520px] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Detach Security Group</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Region</label>
            <input value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} className={`w-full border rounded px-3 py-2 text-sm ${errors.region ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">ENI ID</label>
            <input value={form.network_interface_id} onChange={(e) => setForm((p) => ({ ...p, network_interface_id: e.target.value }))} className={`w-full border rounded px-3 py-2 text-sm ${errors.network_interface_id ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.network_interface_id && <p className="text-xs text-red-500 mt-1">{errors.network_interface_id}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Security Group</label>
            <select
              value={form.security_group_id}
              onChange={(e) => setForm((p) => ({ ...p, security_group_id: e.target.value }))}
              className={`w-full border rounded px-3 py-2 text-sm ${errors.security_group_id ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select Security Group</option>
              {(securityGroups || []).map((sg) => (
                <option key={sg.id} value={sg.id}>{sg.name || sg.id}</option>
              ))}
            </select>
            {errors.security_group_id && <p className="text-xs text-red-500 mt-1">{errors.security_group_id}</p>}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 rounded bg-[#288DD1] text-white text-sm disabled:opacity-50">{isPending ? 'Detaching...' : 'Detach'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
