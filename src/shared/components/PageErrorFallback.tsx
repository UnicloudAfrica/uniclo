import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface PageErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

const PageErrorFallback: React.FC<PageErrorFallbackProps> = ({ error, resetError }) => {
  const isDev = import.meta.env.DEV;

  const handleReload = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-red-200 dark:border-red-900/40 overflow-hidden max-w-lg w-full">
        <div className="px-6 py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
            An unexpected error occurred. Try refreshing the page.
          </p>

          {isDev && error && (
            <pre className="mb-6 max-h-32 overflow-auto rounded-lg bg-gray-100 dark:bg-neutral-800 p-3 text-left text-xs text-red-600 dark:text-red-400 mx-auto max-w-md">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          )}

          <button
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <RefreshCw size={14} />
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageErrorFallback;
