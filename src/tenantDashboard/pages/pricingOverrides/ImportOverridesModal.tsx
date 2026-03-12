import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { ModernButton, ModernModal } from "@/shared/components/ui";
import type { ModalAction } from "@/shared/components/ui/ModernModal";
import {
  type TenantPricingImportError,
  type TenantPricingImportResult,
} from "@/hooks/tenantHooks/tenantPricingHooks";
import { FileInput } from "@/utils/fileInput";

/* ------------------------------------------------------------------ */
/*  CSV helpers                                                        */
/* ------------------------------------------------------------------ */

const normalizeHeader = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/([^a-z0-9]+)/g, "_")
    .replace(/(^_+|_+$)/g, "");

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current);
      if (row.some((value) => String(value).trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current);
    if (row.some((value) => String(value).trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
};

const buildCsv = (headers: string[], rows: string[][]): string => {
  const escapeCsv = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escapeCsv).join(",")];
  rows.forEach((row) => {
    lines.push(row.map(escapeCsv).join(","));
  });
  return lines.join("\n");
};

const stripCsvColumns = async (file: File): Promise<File> => {
  const expectedHeaders: string[] = [
    "provider",
    "region",
    "country_code",
    "product_id",
    "product_name",
    "productable_type",
    "productable_id",
    "price_usd",
  ];

  try {
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) return file;

    const headerRow = rows[0] || [];
    const normalizedHeaderMap = headerRow.reduce<Record<string, number>>((acc, header, index) => {
      const normalized = normalizeHeader(header);
      if (normalized) {
        acc[normalized] = index;
      }
      return acc;
    }, {});

    const dataRows: string[][] = rows.slice(1).map((row) => {
      return expectedHeaders.map((header) => {
        const index = normalizedHeaderMap[header];
        return index !== undefined ? (row[index] ?? "") : "";
      });
    });

    const csv = buildCsv(expectedHeaders, dataRows);
    return new File([csv], file.name, { type: "text/csv" });
  } catch {
    return file;
  }
};

/* ------------------------------------------------------------------ */
/*  Component props                                                    */
/* ------------------------------------------------------------------ */

export interface ImportOverridesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: string;
  isExporting: boolean;
  onExportCsv: () => void;
  onImport: (params: { file: File; dry_run: boolean }) => Promise<TenantPricingImportResult>;
  isImporting: boolean;
  onImportComplete: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ImportOverridesModal: React.FC<ImportOverridesModalProps> = ({
  isOpen,
  onClose,
  selectedRegion,
  isExporting,
  onExportCsv,
  onImport,
  isImporting,
  onImportComplete,
}) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDryRun, setImportDryRun] = useState(false);
  const [importResult, setImportResult] = useState<TenantPricingImportResult | null>(null);
  const [importError, setImportError] = useState("");

  const resetState = useCallback(() => {
    setImportFile(null);
    setImportDryRun(false);
    setImportResult(null);
    setImportError("");
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleImport = useCallback(
    async (forceDryRun?: boolean) => {
      if (!importFile) {
        setImportError("Please select a CSV file to upload.");
        return;
      }

      try {
        let file: File = importFile;
        if (
          String(importFile.name || "")
            .toLowerCase()
            .endsWith(".csv")
        ) {
          file = await stripCsvColumns(importFile);
        }
        const res = await onImport({ file, dry_run: forceDryRun ?? importDryRun });
        setImportResult(res);
        onImportComplete();
      } catch {
        // tenantMultipartApi handles toast errors
      }
    },
    [importFile, importDryRun, onImport, onImportComplete]
  );

  const importModalActions = useMemo<ModalAction[]>(() => {
    if (importResult) {
      const actions: ModalAction[] = [
        {
          label: "Close",
          variant: "primary",
          onClick: handleClose,
        },
      ];

      if (importResult.dry_run) {
        actions.push({
          label: isImporting ? "Importing..." : "Run Import",
          variant: "outline",
          onClick: () => {
            void handleImport(false);
          },
          disabled: isImporting || !importFile,
        });
      }
      return actions;
    }

    return [
      {
        label: "Cancel",
        variant: "ghost",
        onClick: handleClose,
      },
      {
        label: isImporting ? "Uploading..." : "Upload",
        variant: "primary",
        onClick: () => {
          void handleImport();
        },
        disabled: isImporting || !importFile,
      },
    ];
  }, [handleClose, handleImport, importFile, importResult, isImporting]);

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={importResult ? "Import Summary" : "Import Overrides"}
      subtitle="Upload a CSV file to update price settings."
      actions={importModalActions}
    >
      {importResult ? (
        <div className="space-y-4 text-sm text-slate-600">
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="text-slate-500">Total rows</div>
            <div className="font-semibold text-slate-800">{importResult.total_rows}</div>
            <div className="text-slate-500">
              {importResult.dry_run ? "Would process" : "Processed"}
            </div>
            <div className="font-semibold text-slate-800">{importResult.processed}</div>
            <div className="text-slate-500">
              {importResult.dry_run ? "Would create/update" : "Succeeded"}
            </div>
            <div className="font-semibold text-slate-800">
              {(importResult.created || 0) + (importResult.updated || 0)}
            </div>
            <div className="text-slate-500">Skipped</div>
            <div className="font-semibold text-slate-800">{importResult.skipped}</div>
            <div className="text-slate-500">Errors</div>
            <div className="font-semibold text-rose-600">{(importResult.errors || []).length}</div>
          </div>

          {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                Error details
              </p>
              <div className="max-h-40 overflow-y-auto rounded-2xl border border-rose-100 bg-rose-50 p-3">
                {importResult.errors.map((error: TenantPricingImportError, index: number) => (
                  <div key={`${error.row}-${index}`} className="mb-2 text-xs text-rose-600">
                    <span className="font-semibold">Row {error.row}: </span>
                    {Array.isArray(error.messages) ? error.messages.join(", ") : error.messages}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <FileInput
            id="tenant-pricing-upload"
            label="Price Settings CSV"
            onChange={(value) => {
              if (value instanceof File) {
                setImportFile(value);
              } else {
                const candidate = value?.target?.files?.[0];
                setImportFile(candidate instanceof File ? candidate : null);
              }
              setImportError("");
            }}
            selectedFile={importFile}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            outputAs="file"
            error={importError}
          />
          <ModernButton
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            isDisabled={!selectedRegion || isExporting}
          >
            <Download size={14} />
            {isExporting ? "Exporting..." : "Download Template"}
          </ModernButton>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={importDryRun}
              onChange={(event) => setImportDryRun(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Perform a dry run (validate without importing)
          </label>
          <p className="text-xs text-slate-400">
            Extra columns in CSV files are stripped before upload.
          </p>
        </div>
      )}
    </ModernModal>
  );
};

export default ImportOverridesModal;
