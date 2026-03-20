import React, { useState } from "react";
import { Globe2, Plus, RefreshCw, X } from "lucide-react";
import type { ElasticIp } from "@/shared/components/infrastructure/types";

interface NetworkInterface {
  port_id?: string;
  ip: string;
  device_index?: number | string;
}

interface AttachElasticIpModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkInterfaces: NetworkInterface[];
  availableElasticIps: ElasticIp[];
  isLoadingEips: boolean;
  isAllocating: boolean;
  isAssociating: boolean;
  onAllocate: () => void;
  onAssociate: (elasticIpId: string, networkInterfaceId: string) => void;
}

const AttachElasticIpModal: React.FC<AttachElasticIpModalProps> = ({
  isOpen,
  onClose,
  networkInterfaces,
  availableElasticIps,
  isLoadingEips,
  isAllocating,
  isAssociating,
  onAllocate,
  onAssociate,
}) => {
  const [selectedNic, setSelectedNic] = useState("");
  const [selectedEip, setSelectedEip] = useState("");
  const [showAllocateConfirm, setShowAllocateConfirm] = useState(false);

  // Auto-select if only one NIC
  React.useEffect(() => {
    if (networkInterfaces.length === 1 && !selectedNic) {
      setSelectedNic(networkInterfaces[0].port_id || networkInterfaces[0].ip);
    }
  }, [networkInterfaces, selectedNic]);

  const handleClose = () => {
    setSelectedNic("");
    setSelectedEip("");
    setShowAllocateConfirm(false);
    onClose();
  };

  const handleOk = () => {
    if (!selectedEip || !selectedNic) return;
    onAssociate(selectedEip, selectedNic);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl m-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Attach Elastic IP</h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 px-5 py-5">
            {/* Network Interface selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Network Interface <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedNic}
                onChange={(e) => setSelectedNic(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select network interface...</option>
                {networkInterfaces.map((nic) => (
                  <option key={nic.port_id || nic.ip} value={nic.port_id || nic.ip}>
                    {nic.ip}
                    {nic.device_index != null ? ` (eth${nic.device_index})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Elastic IP selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Elastic IP <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedEip}
                  onChange={(e) => setSelectedEip(e.target.value)}
                  disabled={isLoadingEips}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {isLoadingEips ? "Loading..." : "Select elastic IP..."}
                  </option>
                  {availableElasticIps.map((eip) => (
                    <option key={eip.id} value={eip.id}>
                      {eip.public_ip || eip.id}
                    </option>
                  ))}
                </select>
                {/* Allocate new button */}
                <button
                  onClick={() => setShowAllocateConfirm(true)}
                  disabled={isAllocating}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                  title="Allocate new Elastic IP"
                >
                  {isAllocating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              </div>
              {availableElasticIps.length === 0 && !isLoadingEips && (
                <p className="mt-1.5 text-xs text-slate-500">
                  No available elastic IPs. Click + to allocate a new one.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
            <button
              onClick={handleClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleOk}
              disabled={!selectedEip || !selectedNic || isAssociating}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAssociating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Attaching...
                </>
              ) : (
                "Ok"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Allocate confirmation sub-modal */}
      {showAllocateConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl m-4">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">Allocate Elastic IP</h3>
              <button
                onClick={() => setShowAllocateConfirm(false)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-start gap-3 px-5 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Globe2 className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-700">
                Are you sure you want to allocate a new elastic IP?
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                onClick={() => setShowAllocateConfirm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAllocateConfirm(false);
                  onAllocate();
                }}
                disabled={isAllocating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttachElasticIpModal;
