import React, { useEffect, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { useDownloadDoc } from "../../../hooks/tenantHooks/leadsHook";

const getFallbackMimeType = (fileName) => {
  const lower = fileName?.toLowerCase() || "";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (/\.(png|jpe?g|gif|bmp|webp)$/i.test(lower)) return "image/*";
  return null;
};

const DocumentViewerModal = ({ isOpen, onClose, document }) => {
  const documentId = document?.identifier;
  const documentName = document?.name || "Document preview";
  const [objectUrl, setObjectUrl] = useState(null);

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
    remove: removeQuery,
  } = useDownloadDoc(documentId, {
    enabled: false,
  });

  useEffect(() => {
    if (isOpen && documentId) {
      refetch();
    }
  }, [isOpen, documentId, refetch]);

  useEffect(() => {
    if (data?.blob) {
      const url = URL.createObjectURL(data.blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [data]);

  useEffect(() => {
    if (!isOpen) {
      setObjectUrl(null);
      if (typeof removeQuery === "function") {
        removeQuery();
      }
    }
  }, [isOpen, removeQuery]);

  if (!isOpen) return null;

  const resolvedMime =
    data?.contentType?.split(";")[0] || getFallbackMimeType(document?.name);
  const isPdf = resolvedMime?.includes("pdf");
  const isImage = resolvedMime?.startsWith("image") || resolvedMime === "image/*";
  const hasPreview = objectUrl && (isPdf || isImage);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-6 font-Outfit">
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {documentName}
            </h2>
            <p className="text-sm text-gray-500">
              Use the viewer below to inspect files fetched directly from the
              backend.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-50 flex items-center justify-center">
          {isFetching && (
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin text-[--theme-color]" />
              <span>Loading document…</span>
            </div>
          )}

          {!isFetching && isError && (
            <div className="flex flex-col items-center text-center px-6 py-12 text-red-600 gap-3">
              <AlertTriangle className="w-10 h-10" />
              <p className="font-semibold">Unable to load the document.</p>
              <p className="text-sm text-red-500">
                {error?.message || "Please try again later."}
              </p>
            </div>
          )}

          {!isFetching && !isError && hasPreview && (
            <>
              {isPdf ? (
                <iframe
                  title={documentName}
                  src={objectUrl}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-black w-full">
                  <img
                    src={objectUrl}
                    alt={documentName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </>
          )}

          {!isFetching && !isError && !hasPreview && (
            <div className="flex flex-col items-center text-center px-6 py-12 text-gray-600 gap-3">
              <AlertTriangle className="w-10 h-10 text-gray-400" />
              <p className="font-semibold">Preview not available</p>
              <p className="text-sm text-gray-500">
                This file type cannot be previewed here. Use the download button
                below to open it locally.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          {objectUrl && (
            <a
              href={objectUrl}
              download={documentName}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Download
            </a>
          )}
          <button
            onClick={onClose}
            className="rounded-full bg-[--theme-color] px-5 py-2 text-sm font-semibold text-white hover:bg-[--secondary-color] transition"
          >
            Close viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
