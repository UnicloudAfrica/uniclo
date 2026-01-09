import React, { useMemo, useState } from "react";
import { LayoutTemplate, Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { useInstanceTemplates, InstanceTemplate } from "../../../hooks/useInstanceTemplates";
import { useInstanceResources } from "../../../hooks/useInstanceResources";
import { useApiContext } from "../../../hooks/useApiContext";
import adminSilentApi from "../../../index/admin/silent";
import tenantSilentApi from "../../../index/tenant/silentTenant";
import clientSilentApi from "../../../index/client/silent";
import ToastUtils from "../../../utils/toastUtil";
import {
  ModernButton,
  ModernModal,
  ModernInput,
  ModernSelect,
  ModernTextarea,
  ResourceEmptyState,
  SearchBar,
  ResourceListCard,
} from "../ui";

interface VolumeDraft {
  id: string;
  volume_type_id: string;
  storage_size_gb: number | string;
}

interface TemplateFormState {
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  region: string;
  provider: string;
  compute_instance_id: string;
  os_image_id: string;
  bandwidth_id: string;
  bandwidth_count: number | string;
  floating_ip_count: number | string;
  volumes: VolumeDraft[];
}

const genId = () => `tmp_${Math.random().toString(36).slice(2, 10)}`;

const createEmptyForm = (): TemplateFormState => ({
  name: "",
  description: "",
  category: "general",
  is_public: false,
  region: "",
  provider: "",
  compute_instance_id: "",
  os_image_id: "",
  bandwidth_id: "",
  bandwidth_count: 1,
  floating_ip_count: 0,
  volumes: [{ id: genId(), volume_type_id: "", storage_size_gb: 50 }],
});

const normalizeId = (value: any) => (value !== undefined && value !== null ? String(value) : "");

const resolveRegionCode = (region: any) =>
  region?.code || region?.region || region?.slug || region?.id || region?.identifier || "";

const buildTemplateForm = (
  template: InstanceTemplate,
  regionProviderMap: Map<string, string>
): TemplateFormState => {
  const config = template.configuration || {};
  const region = normalizeId(config.region || config.region_code || config.location);
  const provider = normalizeId(
    config.provider || regionProviderMap.get(region) || config.provider_code || ""
  );
  const compute =
    config.compute_instance_id ||
    config.compute?.instance_type_id ||
    config.compute?.id ||
    config.compute?.instance_id ||
    "";
  const osImage =
    config.os_image_id ||
    config.os_image?.os_image_id ||
    config.os_image?.id ||
    config.os_image?.identifier ||
    "";
  const bandwidth =
    config.bandwidth_id ||
    config.networking?.bandwidth_id ||
    config.networking?.bandwidth?.id ||
    "";
  const bandwidthCount = config.bandwidth_count || config.networking?.bandwidth_count || 1;
  const floatingIpCount =
    config.floating_ip_count ||
    config.networking?.floating_ip_count ||
    config.add_ons?.floating_ips?.count ||
    0;

  const rawVolumes = Array.isArray(config.volume_types)
    ? config.volume_types
    : Array.isArray(config.volumes)
      ? config.volumes
      : [];

  const volumeEntries = rawVolumes.length
    ? rawVolumes.map((volume: any, index: number) => ({
        id: volume?.id || `vol_${index}_${genId()}`,
        volume_type_id: normalizeId(
          volume?.volume_type_id || volume?.id || volume?.identifier || ""
        ),
        storage_size_gb: volume?.storage_size_gb ?? volume?.size_gb ?? volume?.size ?? 50,
      }))
    : [
        {
          id: genId(),
          volume_type_id: normalizeId(config.volume_type_id || ""),
          storage_size_gb: config.storage_size_gb ?? 50,
        },
      ];

  return {
    name: template.name || "",
    description: template.description || "",
    category: template.category || "general",
    is_public: Boolean(template.is_public),
    region,
    provider,
    compute_instance_id: normalizeId(compute),
    os_image_id: normalizeId(osImage),
    bandwidth_id: normalizeId(bandwidth),
    bandwidth_count: bandwidthCount || 1,
    floating_ip_count: floatingIpCount || 0,
    volumes: volumeEntries.length
      ? volumeEntries
      : [{ id: genId(), volume_type_id: "", storage_size_gb: 50 }],
  };
};

const formatCurrency = (amount?: number, currency = "USD") => {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `$${Number(amount).toFixed(2)}`;
  }
};

const TemplateManager: React.FC = () => {
  const { context } = useApiContext();
  const apiFn = useMemo(() => {
    if (context === "admin") return adminSilentApi;
    if (context === "tenant") return tenantSilentApi;
    return clientSilentApi;
  }, [context]);

  const { resources, isLoadingResources } = useInstanceResources({ apiFn });
  const {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isCreating,
    isUpdating,
  } = useInstanceTemplates();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InstanceTemplate | null>(null);
  const [formState, setFormState] = useState<TemplateFormState>(() => createEmptyForm());

  const regionProviderMap = useMemo(() => {
    const map = new Map<string, string>();
    (resources.regions || []).forEach((region: any) => {
      const code = resolveRegionCode(region);
      if (code && region?.provider) {
        map.set(String(code), String(region.provider));
      }
    });
    return map;
  }, [resources.regions]);

  const regionOptions = useMemo(() => {
    return (resources.regions || [])
      .map((region: any) => {
        const value = resolveRegionCode(region);
        if (!value) return null;
        const label = region?.name || region?.display_name || region?.label || value;
        return {
          value: String(value),
          label:
            region?.name && region?.name.toLowerCase() !== String(value).toLowerCase()
              ? `${region.name} (${value})`
              : String(label),
        };
      })
      .filter(Boolean) as { value: string; label: string }[];
  }, [resources.regions]);

  const computeOptions = useMemo(() => {
    return (resources.instance_types || []).map((item: any) => {
      const vcpu = item?.vcpus || item?.vcpu;
      const memoryGb = item?.memory_mb
        ? Math.round(Number(item.memory_mb) / 1024)
        : item?.memory_gb;
      const meta: string[] = [];
      if (vcpu) meta.push(`${vcpu} vCPU`);
      if (memoryGb) meta.push(`${memoryGb} GB RAM`);
      const label = meta.length ? `${item.name} • ${meta.join(" • ")}` : item.name;
      return { value: String(item.id), label: label || `Instance ${item.id}` };
    });
  }, [resources.instance_types]);

  const osImageOptions = useMemo(() => {
    return (resources.os_images || []).map((item: any) => ({
      value: String(item.id),
      label: item.name || `OS Image ${item.id}`,
    }));
  }, [resources.os_images]);

  const volumeOptions = useMemo(() => {
    return (resources.volume_types || []).map((item: any) => ({
      value: String(item.id),
      label: item.name || `Volume ${item.id}`,
    }));
  }, [resources.volume_types]);

  const bandwidthOptions = useMemo(() => {
    return (resources.bandwidths || []).map((item: any) => ({
      value: String(item.id || item.identifier),
      label: item.name || item.label || `Bandwidth ${item.id}`,
    }));
  }, [resources.bandwidths]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((template) => {
      const name = template.name?.toLowerCase() || "";
      const description = template.description?.toLowerCase() || "";
      const category = template.category?.toLowerCase() || "";
      return name.includes(query) || description.includes(query) || category.includes(query);
    });
  }, [templates, search]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormState(createEmptyForm());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template: InstanceTemplate) => {
    setEditingTemplate(template);
    setFormState(buildTemplateForm(template, regionProviderMap));
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setFormState(createEmptyForm());
  };

  const updateForm = (patch: Partial<TemplateFormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
  };

  const handleRegionChange = (value: string) => {
    const provider = regionProviderMap.get(value) || "";
    updateForm({ region: value, provider });
  };

  const handleAddVolume = () => {
    setFormState((prev) => ({
      ...prev,
      volumes: [...prev.volumes, { id: genId(), volume_type_id: "", storage_size_gb: 20 }],
    }));
  };

  const handleUpdateVolume = (id: string, patch: Partial<VolumeDraft>) => {
    setFormState((prev) => ({
      ...prev,
      volumes: prev.volumes.map((volume) => (volume.id === id ? { ...volume, ...patch } : volume)),
    }));
  };

  const handleRemoveVolume = (id: string) => {
    setFormState((prev) => {
      const next = prev.volumes.filter((volume) => volume.id !== id);
      return {
        ...prev,
        volumes: next.length ? next : [{ id: genId(), volume_type_id: "", storage_size_gb: 50 }],
      };
    });
  };

  const buildTemplatePayload = () => {
    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      ToastUtils.error("Template name is required.");
      return null;
    }
    if (!formState.region) {
      ToastUtils.error("Select a region for this template.");
      return null;
    }
    if (!formState.provider) {
      ToastUtils.error("Provider not found for the selected region.");
      return null;
    }
    if (!formState.compute_instance_id) {
      ToastUtils.error("Select a compute profile for this template.");
      return null;
    }
    if (!formState.os_image_id) {
      ToastUtils.error("Select an OS image for this template.");
      return null;
    }

    const volumes = formState.volumes
      .map((volume) => ({
        volume_type_id: volume.volume_type_id,
        storage_size_gb: Number(volume.storage_size_gb) || 0,
      }))
      .filter((volume) => Boolean(volume.volume_type_id));

    if (volumes.length === 0) {
      ToastUtils.error("Add at least one volume for this template.");
      return null;
    }

    const configuration: Record<string, any> = {
      provider: formState.provider,
      region: formState.region,
      compute_instance_id: formState.compute_instance_id,
      os_image_id: formState.os_image_id,
      volume_types: volumes,
      floating_ip_count: Number(formState.floating_ip_count) || 0,
    };

    if (formState.bandwidth_id) {
      configuration.bandwidth_id = formState.bandwidth_id;
      configuration.bandwidth_count = Number(formState.bandwidth_count) || 1;
    }

    return {
      name: trimmedName,
      description: formState.description.trim() || undefined,
      configuration,
      is_public: formState.is_public,
      category: formState.category.trim() || "general",
    };
  };

  const handleSubmit = () => {
    const payload = buildTemplatePayload();
    if (!payload) return;

    if (editingTemplate) {
      updateTemplate(
        { id: editingTemplate.id, payload },
        {
          onSuccess: () => {
            handleCloseModal();
          },
        }
      );
      return;
    }

    createTemplate(payload, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleDelete = (template: InstanceTemplate) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    deleteTemplate(template.id);
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary-50 p-2 text-primary-600">
            <LayoutTemplate className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Instance Templates</h2>
            <p className="text-sm text-slate-500">
              Create reusable blueprints and keep provisioning consistent across teams.
            </p>
          </div>
        </div>
        <ModernButton
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreate}
        >
          New Template
        </ModernButton>
      </div>

      <div className="max-w-md">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search templates"
          isLoading={isLoading}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <ResourceEmptyState
          title="No templates found"
          message="Create a template to speed up instance provisioning for your team."
          action={
            <ModernButton variant="primary" onClick={handleOpenCreate}>
              Create template
            </ModernButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredTemplates.map((template) => {
            const config = template.configuration || {};
            const compute = config.compute || {};
            const computeMeta: string[] = [];
            if (compute?.vcpu) computeMeta.push(`${compute.vcpu} vCPU`);
            if (compute?.ram_mb) {
              computeMeta.push(`${Math.round(Number(compute.ram_mb) / 1024)} GB RAM`);
            }
            const computeLabel = compute?.name
              ? computeMeta.length
                ? `${compute.name} • ${computeMeta.join(" • ")}`
                : compute.name
              : config.compute_instance_id || "—";

            const osLabel = config.os_image?.name || config.os_image_id || "—";

            const volume =
              (Array.isArray(config.volumes) && config.volumes[0]) ||
              (Array.isArray(config.volume_types) && config.volume_types[0]) ||
              {};
            const volumeLabel = volume?.name || volume?.volume_type_id || "—";
            const volumeSize = volume?.size_gb ?? volume?.storage_size_gb;
            const storageLabel = volumeSize ? `${volumeLabel} • ${volumeSize} GB` : volumeLabel;

            const pricing = template.pricing_cache || {};
            const monthly = formatCurrency(pricing.monthly_total_usd, pricing.currency || "USD");
            const yearly = pricing.yearly_total_usd
              ? formatCurrency(pricing.yearly_total_usd, pricing.currency || "USD")
              : "—";

            return (
              <ResourceListCard
                key={template.id}
                title={template.name}
                subtitle={template.category || "general"}
                statuses={[
                  {
                    label: template.is_public ? "Public" : "Private",
                    tone: template.is_public ? "success" : "neutral",
                  },
                ]}
                metadata={[
                  { label: "Region", value: config.region || "—" },
                  { label: "Provider", value: config.provider || "—" },
                  { label: "Compute", value: computeLabel },
                  { label: "OS Image", value: osLabel },
                  { label: "Storage", value: storageLabel },
                  { label: "Monthly", value: monthly },
                  { label: "Yearly", value: yearly },
                ]}
                actions={[
                  {
                    label: "Edit",
                    icon: <Pencil className="h-4 w-4" />,
                    onClick: () => handleOpenEdit(template),
                  },
                  {
                    label: "Delete",
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: () => handleDelete(template),
                    variant: "danger",
                  },
                ]}
              />
            );
          })}
        </div>
      )}

      <ModernModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTemplate ? "Edit Template" : "New Template"}
        subtitle="Define a reusable configuration for provisioning."
        size="lg"
        actions={[
          {
            label: "Cancel",
            variant: "ghost",
            onClick: handleCloseModal,
          },
          {
            label: editingTemplate ? "Update Template" : "Create Template",
            variant: "primary",
            onClick: handleSubmit,
            disabled: isSaving,
            icon: isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined,
          },
        ]}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModernInput
              label="Template name"
              value={formState.name}
              onChange={(event) => updateForm({ name: event.target.value })}
              placeholder="e.g. Web Server Starter"
            />
            <ModernInput
              label="Category"
              value={formState.category}
              onChange={(event) => updateForm({ category: event.target.value })}
              placeholder="general"
            />
          </div>

          <ModernTextarea
            label="Description"
            value={formState.description}
            onChange={(event) => updateForm({ description: event.target.value })}
            placeholder="Describe what this template is best for"
            rows={3}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModernSelect
              label="Visibility"
              value={formState.is_public ? "public" : "private"}
              onChange={(event) => updateForm({ is_public: event.target.value === "public" })}
              options={[
                { value: "private", label: "Private" },
                { value: "public", label: "Public" },
              ]}
            />
            <div className="flex items-end gap-2 text-xs text-slate-500">
              {formState.is_public ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <Eye className="h-4 w-4" /> Visible to all users
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <EyeOff className="h-4 w-4" /> Only visible to you
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-800">Infrastructure</h3>
            <p className="text-xs text-slate-500">Base compute and image selections.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ModernSelect
                label="Region"
                value={formState.region}
                onChange={(event) => handleRegionChange(event.target.value)}
                options={[{ value: "", label: "Select region" }, ...regionOptions]}
                disabled={isLoadingResources}
              />
              <ModernInput label="Provider" value={formState.provider} disabled />
              <ModernSelect
                label="Compute profile"
                value={formState.compute_instance_id}
                onChange={(event) => updateForm({ compute_instance_id: event.target.value })}
                options={[{ value: "", label: "Select compute" }, ...computeOptions]}
                disabled={isLoadingResources}
              />
              <ModernSelect
                label="OS Image"
                value={formState.os_image_id}
                onChange={(event) => updateForm({ os_image_id: event.target.value })}
                options={[{ value: "", label: "Select OS image" }, ...osImageOptions]}
                disabled={isLoadingResources}
              />
              <ModernSelect
                label="Bandwidth (optional)"
                value={formState.bandwidth_id}
                onChange={(event) => updateForm({ bandwidth_id: event.target.value })}
                options={[{ value: "", label: "No bandwidth" }, ...bandwidthOptions]}
                disabled={isLoadingResources || bandwidthOptions.length === 0}
              />
              <ModernInput
                label="Bandwidth count"
                type="number"
                value={formState.bandwidth_count}
                onChange={(event) => updateForm({ bandwidth_count: event.target.value })}
                disabled={!formState.bandwidth_id}
              />
              <ModernInput
                label="Floating IPs"
                type="number"
                value={formState.floating_ip_count}
                onChange={(event) => updateForm({ floating_ip_count: event.target.value })}
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Storage</h3>
                <p className="text-xs text-slate-500">Define primary and additional volumes.</p>
              </div>
              <ModernButton variant="outline" size="sm" onClick={handleAddVolume}>
                Add volume
              </ModernButton>
            </div>

            <div className="mt-4 space-y-3">
              {formState.volumes.map((volume, index) => (
                <div key={volume.id} className="grid grid-cols-1 gap-3 md:grid-cols-6">
                  <div className="md:col-span-4">
                    <ModernSelect
                      label={index === 0 ? "Primary volume" : `Volume ${index + 1}`}
                      value={volume.volume_type_id}
                      onChange={(event) =>
                        handleUpdateVolume(volume.id, { volume_type_id: event.target.value })
                      }
                      options={[{ value: "", label: "Select volume" }, ...volumeOptions]}
                      disabled={isLoadingResources}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <ModernInput
                      label="Size (GB)"
                      type="number"
                      value={volume.storage_size_gb}
                      onChange={(event) =>
                        handleUpdateVolume(volume.id, { storage_size_gb: event.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVolume(volume.id)}
                    >
                      Remove
                    </ModernButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModernModal>
    </div>
  );
};

export default TemplateManager;
