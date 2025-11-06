import React from "react";
import { X } from "lucide-react";

const DocumentViewerModal = ({ isOpen, onClose, fileUrl, fileName }) => {
  if (!isOpen) return null;

  const isPdf = fileName?.toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-6 font-Outfit">
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {fileName || "Document preview"}
            </h2>
            <p className="text-sm text-gray-500">
              Use the built-in viewer to inspect the uploaded document.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-50">
          {isPdf ? (
            <iframe
              title={fileName}
              src={fileUrl}
              className="h-full w-full"
              frameBorder="0"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-black">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <a
            href={fileUrl}
            download={fileName}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Download
          </a>
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
