import React from "react";
import { Image } from "lucide-react";

interface DocScreenshotProps {
  caption: string;
  src?: string;
  alt?: string;
}

const DocScreenshot: React.FC<DocScreenshotProps> = ({ caption, src, alt }) => {
  if (src) {
    return (
      <figure className="my-6">
        <img src={src} alt={alt || caption} className="w-full rounded-lg border shadow-sm" style={{ borderColor: "var(--theme-border-color, #e5e7eb)" }} />
        <figcaption className="mt-2 text-sm text-center" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
          {caption}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="my-6">
      <div
        className="w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center py-12 px-6"
        style={{
          borderColor: "var(--theme-color, #288DD1)",
          backgroundColor: "color-mix(in srgb, var(--theme-color, #288DD1) 5%, transparent)",
        }}
      >
        <Image size={40} style={{ color: "var(--theme-color, #288DD1)", opacity: 0.5 }} />
        <p className="mt-3 text-sm font-medium" style={{ color: "var(--theme-color, #288DD1)" }}>
          {caption}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
          This will reflect your organization's branding
        </p>
      </div>
    </figure>
  );
};

export default DocScreenshot;
