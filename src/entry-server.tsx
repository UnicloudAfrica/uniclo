import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import QueryProvider from "./utils/queryProvider";
import StaticMarketingProvider from "./contexts/StaticMarketingProvider";

type HelmetContext = {
  helmet?: {
    title?: { toString: () => string };
    meta?: { toString: () => string };
    link?: { toString: () => string };
    style?: { toString: () => string };
    script?: { toString: () => string };
    noscript?: { toString: () => string };
  };
};

export const render = (url: string) => {
  const helmetContext: HelmetContext = {};

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <QueryProvider>
        <StaticMarketingProvider>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </StaticMarketingProvider>
      </QueryProvider>
    </HelmetProvider>
  );

  const head = [
    helmetContext.helmet?.title?.toString?.() ?? "",
    helmetContext.helmet?.meta?.toString?.() ?? "",
    helmetContext.helmet?.link?.toString?.() ?? "",
    helmetContext.helmet?.style?.toString?.() ?? "",
    helmetContext.helmet?.script?.toString?.() ?? "",
    helmetContext.helmet?.noscript?.toString?.() ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, head };
};
