import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import mermaid from "mermaid";

let mermaidInitialized = false;

interface DocMermaidProps {
  chart: string;
  caption?: string;
}

const DocMermaid: React.FC<DocMermaidProps> = ({ chart, caption }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (!mermaidInitialized) {
      const themeColor =
        getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim() ||
        "#0A5E3E";
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: themeColor,
          primaryTextColor: "#fff",
          primaryBorderColor: themeColor,
          lineColor: "#94a3b8",
          secondaryColor: "#f1f5f9",
          tertiaryColor: "#f8fafc",
          fontFamily: "inherit",
        },
      });
      mermaidInitialized = true;
    }

    let cancelled = false;
    mermaid.render(idRef.current, chart.trim()).then(({ svg: renderedSvg }) => {
      if (!cancelled) setSvg(renderedSvg);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [chart]);

  return (
    <figure className="my-6">
      <div
        ref={containerRef}
        className="overflow-x-auto p-4 rounded-lg border flex justify-center"
        style={{ borderColor: "var(--theme-border-color, #e5e7eb)", backgroundColor: "#fff" }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svg, {
          // M-03: Disable SVG filter profile (no <filter> primitives),
          // explicitly forbid every SVG element that can execute JS or
          // pull remote content (<script>, <foreignObject>, the SMIL
          // animation set, and <use> which can dereference an external
          // symbol), and block all known event-handler attributes
          // including SMIL timing attrs (onbegin/onend/onrepeat) and
          // any `href` / `xlink:href` which <use> relies on.
          //
          // ALLOWED_URI_REGEXP restricts attribute URIs to http(s)/
          // mailto/ftp/tel or relative refs — blocks javascript:,
          // data: and similar schemes.
          USE_PROFILES: { svg: true, svgFilters: false },
          FORBID_TAGS: [
            'script',
            'foreignObject',
            'set',
            'animate',
            'animateTransform',
            'animateMotion',
            'use',
          ],
          FORBID_ATTR: [
            'onload',
            'onerror',
            'onclick',
            'onmouseover',
            'onfocus',
            'onblur',
            'onbegin',
            'onend',
            'onrepeat',
            'href',
            'xlink:href',
          ],
          ALLOWED_URI_REGEXP:
            /^(?:(?:https?|mailto|ftp|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
        }) }}
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-center" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default DocMermaid;
