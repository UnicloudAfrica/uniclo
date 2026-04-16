import { useState } from "react";
import { Download, Loader2, CheckCircle, Search } from "lucide-react";
import { useDiscoveredImages, useImportUpstreamImage } from "@/hooks/adminHooks/imageDiscoveryHooks";
import { ModernButton } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";

interface ImageDiscoveryPanelProps {
  regions: string[];
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatBytes = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const ImageDiscoveryPanel = ({ regions }: ImageDiscoveryPanelProps) => {
  const [distroFilter, setDistroFilter] = useState<string>("");
  const { data: discovered = [], isFetching } = useDiscoveredImages(distroFilter || undefined);
  const importMutation = useImportUpstreamImage();
  const [importingKey, setImportingKey] = useState<string | null>(null);

  const handleImport = (distro: string, version: string, arch: string, region: string) => {
    const key = `${distro}:${version}:${region}`;
    setImportingKey(key);
    importMutation.mutate(
      { distro, version, arch, region },
      {
        onSuccess: () => {
          ToastUtils.success(`Import queued: ${capitalize(distro)} ${version} → ${region}`);
          setImportingKey(null);
        },
        onError: () => {
          setImportingKey(null);
        },
      }
    );
  };

  const distros = [...new Set(discovered.map((d) => d.image.distro))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Upstream Image Discovery</h3>
          <p className="text-xs text-slate-400">
            Images discovered from upstream OS mirrors. Import directly to any region.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={distroFilter}
              onChange={(e) => setDistroFilter(e.target.value)}
              className="rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs text-slate-600"
            >
              <option value="">All distros</option>
              {distros.map((d) => (
                <option key={d} value={d}>
                  {capitalize(d)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isFetching && !discovered.length ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Discovering upstream images...
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">Distro</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">Version</th>
                <th className="px-4 py-2.5 text-center font-medium text-slate-500">Arch</th>
                <th className="px-4 py-2.5 text-center font-medium text-slate-500">Size</th>
                {regions.map((r) => (
                  <th key={r} className="px-4 py-2.5 text-center font-medium text-slate-500">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discovered.map((entry, idx) => {
                const img = entry.image;
                return (
                  <tr
                    key={`${img.distro}-${img.version}-${idx}`}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {capitalize(img.distro)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{img.version}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{img.arch}</td>
                    <td className="px-4 py-3 text-center text-slate-500">
                      {formatBytes(img.file_size_bytes)}
                    </td>
                    {regions.map((region) => {
                      const status = entry.regions[region];
                      const isImporting =
                        importingKey === `${img.distro}:${img.version}:${region}`;

                      return (
                        <td key={region} className="px-4 py-3 text-center">
                          {status === "active" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Active
                            </span>
                          ) : (
                            <ModernButton
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                handleImport(img.distro, img.version, img.arch, region)
                              }
                              disabled={isImporting}
                              className="text-xs"
                            >
                              {isImporting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                              Import
                            </ModernButton>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ImageDiscoveryPanel;
