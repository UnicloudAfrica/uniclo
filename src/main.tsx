import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n"; // Bootstraps i18next before any component reads translations
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "sonner";
import QueryProvider from "./utils/queryProvider";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import { initSentry } from "./utils/sentry";

initSentry();

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <HelmetProvider>
          <QueryProvider>
            <Toaster position="top-right" richColors closeButton />
            <App />
          </QueryProvider>
        </HelmetProvider>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);
