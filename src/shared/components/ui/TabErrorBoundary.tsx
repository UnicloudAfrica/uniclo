import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {this.props.tabName ? `Failed to load ${this.props.tabName}` : "Something went wrong"}
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              {import.meta.env.PROD
                ? "An unexpected error occurred. Please try again."
                : (this.state.error?.message || "An unexpected error occurred.")}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TabErrorBoundary;
