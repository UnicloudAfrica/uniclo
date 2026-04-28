import { useEffect, useState } from "react";

type SrcLike = string | null | undefined;

/**
 * Render an image with a graceful-degradation fallback. `primarySrc`
 * is attempted first; if it fires `onError` the hook swaps to the
 * fallback. Accepts any nullable string shape (nothing, URL, data-URI,
 * import reference) — both inputs are coerced to `string | null`.
 */
const useImageFallback = (primarySrc: SrcLike, fallbackSrc: SrcLike) => {
  const [src, setSrc] = useState<string>(primarySrc || fallbackSrc || "");

  useEffect(() => {
    setSrc(primarySrc || fallbackSrc || "");
  }, [primarySrc, fallbackSrc]);

  const handleError = () => {
    if (!fallbackSrc) return;
    setSrc((current) => (current === fallbackSrc ? current : fallbackSrc));
  };

  return { src, onError: handleError };
};

export default useImageFallback;
