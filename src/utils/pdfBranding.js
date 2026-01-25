const IMAGE_DATA_PREFIX = /^data:image\//i;

const normalizeSrc = (src) => (typeof src === "string" ? src.trim() : "");

const isSvgSource = (src) => {
  const normalized = normalizeSrc(src).toLowerCase();
  return normalized.endsWith(".svg") || normalized.startsWith("data:image/svg");
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image data"));
    reader.readAsDataURL(blob);
  });

export const getImageDataUrl = async (src) => {
  const normalized = normalizeSrc(src);
  if (!normalized) return null;
  if (isSvgSource(normalized)) return null;
  if (IMAGE_DATA_PREFIX.test(normalized)) return normalized;

  try {
    const response = await fetch(normalized);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.type && blob.type.includes("svg")) return null;
    return await blobToDataUrl(blob);
  } catch (error) {
    return null;
  }
};

export const getImageFormat = (dataUrl) => {
  const normalized = normalizeSrc(dataUrl).toLowerCase();
  const match = normalized.match(/^data:image\/(png|jpeg|jpg|webp)/i);
  if (!match) return "PNG";
  const format = match[1].toUpperCase();
  return format === "JPG" ? "JPEG" : format;
};

export const resolvePdfLogo = async (primarySrc, fallbackSrc) => {
  const primaryData = await getImageDataUrl(primarySrc);
  if (primaryData) {
    return { dataUrl: primaryData, format: getImageFormat(primaryData) };
  }

  const fallbackData = await getImageDataUrl(fallbackSrc);
  if (!fallbackData) return null;
  return { dataUrl: fallbackData, format: getImageFormat(fallbackData) };
};

export const hexToRgbArray = (hex, fallback = [40, 141, 209]) => {
  if (!hex || typeof hex !== "string") return fallback;
  let normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    normalized = `${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`;
  }
  if (normalized.length !== 6 || Number.isNaN(parseInt(normalized, 16))) {
    return fallback;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
};
