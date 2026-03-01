import { useEffect, useState } from "react";

const useImageFallback = (primarySrc, fallbackSrc) => {
  const [src, setSrc] = useState(primarySrc || fallbackSrc || "");

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
