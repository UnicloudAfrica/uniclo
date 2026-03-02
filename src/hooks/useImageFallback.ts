import { useEffect, useState } from "react";

const useImageFallback = (primarySrc: any, fallbackSrc: any) => {
  const [src, setSrc] = useState(primarySrc || fallbackSrc || "");

  useEffect(() => {
    setSrc(primarySrc || fallbackSrc || "");
  }, [primarySrc, fallbackSrc]);

  const handleError = () => {
    if (!fallbackSrc) return;
    setSrc((current: any) => (current === fallbackSrc ? current : fallbackSrc));
  };

  return { src, onError: handleError };
};

export default useImageFallback;
