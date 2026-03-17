import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "sonner";
import QueryProvider from "./utils/queryProvider";
import { HelmetProvider } from "@dr.pogodin/react-helmet";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Router>
      <HelmetProvider>
        <QueryProvider>
          <Toaster position="top-right" richColors closeButton />
          <App />
        </QueryProvider>
      </HelmetProvider>
    </Router>
  </React.StrictMode>
);
