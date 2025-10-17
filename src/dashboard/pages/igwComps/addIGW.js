import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreateTenantInternetGateway } from "../../../hooks/internetGatewayHooks";
import ToastUtils from "../../../utils/toastUtil";

const AddIgwModal = ({
  isOpen,
  onClose,
  projectId,
  region: defaultRegion = "",
}) => {
  const [form, setForm] = useState({ name: "", region: defaultRegion || "" });
  const [errors, setErrors] = useState({});
  const { mutate: createIgw, isPending } = useCreateTenantInternetGateway();

  useEffect(() => {
    if (defaultRegion && !form.region) {
      setForm((prev) => ({ ...prev, region: defaultRegion }));
    }
  }, [defaultRegion, form.region]);

  if (!isOpen) return null;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.region) next.region = "Region is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
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
          ToastUtils.success("Internet Gateway created.");
          onClose();
        },
        onError: (err) => {
          console.error("Failed to create IGW:", err);
          ToastUtils.error(err?.message || "Failed to create IGW.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[520px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Add Internet Gateway
          </h2>
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
              placeholder="e.g., igw-public"
              className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
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
            {errors.region && (
              <p className="text-xs text-red-500 mt-1">{errors.region}</p>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Create
            {isPending && (
              <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddIgwModal;
