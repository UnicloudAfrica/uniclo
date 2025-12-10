import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import ContextProvider from "./contexts/contextprovider";
import ObjectStorageProvider from "./contexts/ObjectStorageContext";
import { Toaster } from "sonner";
import QueryProvider from "./utils/queryProvider";
import { HelmetProvider } from "react-helmet-async";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Router>
      <HelmetProvider>
        <QueryProvider>
          <Toaster position="top-right" richColors closeButton />
          <ContextProvider>
            <ObjectStorageProvider>
              <App />
            </ObjectStorageProvider>
          </ContextProvider>
        </QueryProvider>
      </HelmetProvider>
    </Router>
  </React.StrictMode>
);
