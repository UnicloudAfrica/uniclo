import { useCallback, useEffect, useMemo, useState } from "react";
import { HardDrive, ShieldCheck, AlertTriangle, Pencil, Trash2, Plus, Globe, MessageSquare } from "lucide-react";
import { useFetchOsImages } from "@/hooks/adminHooks/os-imageHooks";
import { useFetchRegions } from "@/hooks/adminHooks/regionHooks";
import ResourceDataExplorer from "../../components/ResourceDataExplorer";
import AddOSImageModal from "./osSubs/addOs";
import DeleteOS from "./osSubs/deleteOS";
import EditOS from "./osSubs/editOs";
import ImageSyncPanel from "./osSubs/ImageSyncPanel";
import ImageDiscoveryPanel from "./osSubs/ImageDiscoveryPanel";
import ImageRequestsDashboard from "./osSubs/ImageRequestsDashboard";
import { ModernButton } from "@/shared/components/ui";

const toTitleCase = (value = "") =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment: string) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

type OsImageShape = {
  id?: string | number;
  identifier?: string;
  name?: string;
  os_family?: string;
  platform?: string;
  distribution?: string;
  version?: string;
  architecture?: string;
  virtualization_type?: string;
  visibility?: string;
};

const getOsDescriptor = (image: OsImageShape) =>
  String(image?.os_family || image?.platform || image?.distribution || image?.name || "").toLowerCase();

const stringHash = (value = "") => {
  let hash = 0;
  const input = value || "os";
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const avatarPalettes = [
  {
    borderColor: "rgb(var(--theme-color-300) / 0.7)",
    textColor: "rgb(var(--theme-color-700) / 0.95)",
    background:
      "linear-gradient(135deg, rgb(var(--theme-color-50) / 0.95) 0%, rgb(var(--theme-color-100) / 0.9) 55%, rgb(var(--theme-color-200) / 0.85) 100%)",
  },
  {
    borderColor: "rgb(var(--theme-success-300) / 0.7)",
    textColor: "rgb(var(--theme-success-700) / 0.95)",
    background:
      "linear-gradient(135deg, rgb(var(--theme-success-50) / 0.95) 0%, rgb(var(--theme-success-100) / 0.9) 55%, rgb(var(--theme-success-200) / 0.85) 100%)",
  },
  {
    borderColor: "rgb(var(--theme-warning-300) / 0.7)",
    textColor: "rgb(var(--theme-warning-700) / 0.95)",
    background:
      "linear-gradient(135deg, rgb(var(--theme-warning-50) / 0.95) 0%, rgb(var(--theme-warning-100) / 0.9) 55%, rgb(var(--theme-warning-200) / 0.85) 100%)",
  },
  {
    borderColor: "rgb(var(--theme-danger-300) / 0.7)",
    textColor: "rgb(var(--theme-danger-700) / 0.95)",
    background:
      "linear-gradient(135deg, rgb(var(--theme-danger-50) / 0.95) 0%, rgb(var(--theme-danger-100) / 0.9) 55%, rgb(var(--theme-danger-200) / 0.85) 100%)",
  },
  {
    borderColor: "rgb(var(--theme-neutral-300) / 0.7)",
    textColor: "rgb(var(--theme-neutral-700) / 0.95)",
    background:
      "linear-gradient(135deg, rgb(var(--theme-neutral-50) / 0.95) 0%, rgb(var(--theme-neutral-100) / 0.9) 55%, rgb(var(--theme-neutral-200) / 0.85) 100%)",
  },
] as const;

const avatarPaletteForSeed = (seed = "os") =>
  avatarPalettes[Math.abs(stringHash(seed)) % avatarPalettes.length];

const buildInitials = (value = "") => {
  const sanitized = value.replace(/[^a-z0-9\s]/gi, " ").trim();
  if (!sanitized) return "OS";
  const parts = sanitized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";
  return `${first}${second}`.toUpperCase();
};

const getAvatarVisuals = (image: OsImageShape) => {
  const descriptor = getOsDescriptor(image);
  const seed = String(descriptor || image?.identifier || image?.name || image?.id?.toString() || "os");
  const palette = avatarPaletteForSeed(seed);

  return {
    label: buildInitials(descriptor || image?.name || "OS"),
    style: {
      borderColor: palette?.borderColor,
      color: palette?.textColor,
      background: palette?.background,
    },
    className:
      "inline-flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-semibold uppercase tracking-wide shadow-sm",
  };
};

const buildDetailChips = (image: OsImageShape) => {
  const values = [
    image?.version,
    image?.architecture ? image.architecture.toUpperCase() : null,
    image?.virtualization_type ? toTitleCase(image.virtualization_type) : null,
    image?.visibility ? toTitleCase(image.visibility) : null,
  ].filter(Boolean) as string[];

  return Array.from(new Set(values));
};

const formatNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString();
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric.toLocaleString();
  }
  return value ?? "—";
};

const OSImages = ({
  selectedRegion,
  selectedProvider,
  onMetricsChange,
}: {
  selectedRegion?: string;
  selectedProvider?: string;
  onMetricsChange?: (metrics: Record<string, unknown>) => void;
}) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const [isAddOSImageModalOpen, setIsAddOSImageModalOpen] = useState(false);
  const [isEditOSImageModalOpen, setIsEditOSImageModalOpen] = useState(false);
  const [isDeleteOSImageModalOpen, setIsDeleteOSImageModalOpen] = useState(false);
  const [selectedOSImage, setSelectedOSImage] = useState<Record<string, unknown> | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "discovery" | "requests">("catalog");
  const { data: regionsData } = useFetchRegions();
  const allRegionCodes = useMemo(
    () => (Array.isArray(regionsData) ? regionsData.map((r: { code?: string }) => String(r.code ?? "")) : []),
    [regionsData]
  );

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedRegion]);

  const { data, isFetching } = useFetchOsImages(
    selectedRegion,
    { page, perPage, search, provider: selectedProvider },
    {
      enabled: Boolean(selectedRegion),
      keepPreviousData: true,
    }
  );

  const rows = useMemo(() => (data as { data?: unknown[] } | undefined)?.data ?? [], [data]);
  const meta = (data as { meta?: { total?: number; current_page?: number; per_page?: number } } | undefined)?.meta ?? null;
  const total = meta?.total ?? rows.length;

  const handleAddOSImage = () => {
    setSelectedOSImage(null);
    setIsAddOSImageModalOpen(true);
  };

  const handleEditOSImage = (image: Record<string, unknown>) => {
    setSelectedOSImage(image);
    setIsEditOSImageModalOpen(true);
  };

  const handleDeleteOSImage = (image: Record<string, unknown>) => {
    setSelectedOSImage(image);
    setIsDeleteOSImageModalOpen(true);
  };

  const licensedCount = useMemo(
    () => rows.filter((image: Record<string, unknown>) => image?.is_licenced).length,
    [rows]
  );

  const unlicensedCount = useMemo(() => rows.length - licensedCount, [rows, licensedCount]);

  useEffect(() => {
    onMetricsChange?.({
      metrics: [
        {
          label: "Templates",
          value: formatNumber(total),
          description: "Catalogued OS images",
          icon: <HardDrive className="h-5 w-5" />,
        },
        {
          label: "Licensed",
          value: formatNumber(licensedCount),
          description: "Images with active licensing",
          icon: <ShieldCheck className="h-5 w-5" />,
        },
        {
          label: "Unlicensed",
          value: formatNumber(unlicensedCount),
          description: "Require licensing review",
          icon: <AlertTriangle className="h-5 w-5" />,
        },
      ],
      description:
        "Maintain golden images so every build meets compliance and provisioning standards.",
    });
  }, [total, licensedCount, unlicensedCount, onMetricsChange]);

  const formatLicenseStatus = (isLicensed: boolean) => {
    if (isLicensed) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
          <ShieldCheck className="h-3.5 w-3.5" /> Licensed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
        <AlertTriangle className="h-3.5 w-3.5" /> Not licensed
      </span>
    );
  };

  const columns = [
    {
      key: "name",
      header: "Image",
      render: (image: OsImageShape) => {
        const { label, className, style } = getAvatarVisuals(image);
        const chips = buildDetailChips(image);
        const platform = image?.platform || image?.os_family;
        return (
          <div className="flex items-center gap-3">
            <span className={className} style={style}>
              {label}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {image.name || "Unknown image"}
              </p>
              <p className="text-xs text-slate-500">{platform ? toTitleCase(platform) : "—"}</p>
              {chips.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {chips.map((chip) => (
                    <span
                      key={String(chip)}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                    >
                      {String(chip)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "region",
      header: "Region",
      align: "center",
      render: (image: { region?: string }) => (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {image.region || "—"}
        </span>
      ),
    },
    {
      key: "is_licenced",
      header: "License",
      align: "center",
      render: (image: { is_licenced?: boolean }) => formatLicenseStatus(Boolean(image.is_licenced)),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (image: Record<string, unknown>) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleEditOSImage(image)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
            title="Edit OS image"
            aria-label="Edit OS image"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteOSImage(image)}
            className="inline-flex items-center justify-center rounded-full border border-red-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
            title="Remove OS image"
            aria-label="Remove OS image"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const primaryAction = (
    <ModernButton size="sm" onClick={handleAddOSImage} className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Add OS image
    </ModernButton>
  );

  const emptyState = {
    icon: (
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
        <HardDrive className="h-5 w-5" />
      </span>
    ),
    title: "No OS images in this catalogue",
    description:
      "Provisioning teams rely on curated OS templates. Add your first image to unlock builds for this region.",
    action: (
      <ModernButton onClick={handleAddOSImage} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create OS image
      </ModernButton>
    ),
  };

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    [setSearch, setPage]
  );

  return (
    <>
      {selectedRegion && (
        <div className="mb-4">
          <ImageSyncPanel region={selectedRegion} provider={selectedProvider} />
        </div>
      )}

      {/* Sub-tabs: Catalog / Discovery / Requests */}
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100/80 p-1">
        {([
          { id: "catalog" as const, label: "Catalog", icon: HardDrive },
          { id: "discovery" as const, label: "Discovery", icon: Globe },
          { id: "requests" as const, label: "Requests", icon: MessageSquare },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={[
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition",
              activeSubTab === tab.id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "catalog" && (
        <>
          <ResourceDataExplorer
            title="Operating system templates"
            description="Curate and maintain the golden images available to provisioning flows across your regions."
            columns={columns as never}
            rows={rows as Record<string, unknown>[]}
            loading={isFetching}
            page={(meta?.current_page as number) ?? page}
            perPage={(meta?.per_page as number) ?? perPage}
            total={(total as number) ?? 0}
            meta={meta as Record<string, unknown>}
            onPageChange={setPage}
            onPerPageChange={(next: number) => {
              setPerPage(next);
              setPage(1);
            }}
            searchValue={search}
            onSearch={handleSearch}
            toolbarSlot={primaryAction}
            emptyState={emptyState}
            highlight
          />
        </>
      )}

      {activeSubTab === "discovery" && (
        <ImageDiscoveryPanel regions={allRegionCodes} />
      )}

      {activeSubTab === "requests" && (
        <ImageRequestsDashboard />
      )}

      <AddOSImageModal
        isOpen={isAddOSImageModalOpen}
        onClose={() => setIsAddOSImageModalOpen(false)}
      />

      <EditOS
        isOpen={isEditOSImageModalOpen}
        onClose={() => setIsEditOSImageModalOpen(false)}
        osImage={selectedOSImage}
      />

      <DeleteOS
        isOpen={isDeleteOSImageModalOpen}
        onClose={() => setIsDeleteOSImageModalOpen(false)}
        osImage={selectedOSImage}
      />
    </>
  );
};

export default OSImages;
