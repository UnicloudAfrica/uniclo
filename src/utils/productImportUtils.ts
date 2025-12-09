import { utils as xlsxUtils } from "xlsx";

export const OBJECT_STORAGE_TYPE = "object_storage_configuration";
export const DEFAULT_OBJECT_STORAGE_PRICE_PER_GB = 0.16;

export const objectStorageNameForQuota = (quota: number): string =>
  quota === 1 ? "Object Storage (per GiB)" : `Object Storage ${quota} GiB`;

export const productTypes = [
  { value: "compute_instance", label: "Compute Instance" },
  { value: "cross_connect", label: "Cross Connect" },
  { value: "os_image", label: "OS Image" },
  { value: "bandwidth", label: "Bandwidth" },
  { value: "ip", label: "Floating IP" },
  { value: OBJECT_STORAGE_TYPE, label: "Object Storage" },
  { value: "volume_type", label: "Volume Type" },
];

export const typeToEndpoint: Record<string, string | null> = {
  compute_instance: "/product-compute-instance",
  cross_connect: "/product-cross-connect",
  os_image: "/product-os-image",
  bandwidth: "/product-bandwidth",
  ip: "/product-floating-ip",
  [OBJECT_STORAGE_TYPE]: null,
  volume_type: "/product-volume-type",
};

export const generateEntryId = (): string =>
  `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export interface ProductEntry {
  id: string;
  name: string;
  productable_type: string;
  productable_id: string;
  productSearch: string;
  provider: string;
  region: string;
  price: string;
  objectStorageQuota: string;
  objectStoragePricePerGb: string;
  options: any[];
  loadingOptions: boolean;
  errors: Record<string, string | null>;
}

export const createEmptyEntry = (): ProductEntry => ({
  id: generateEntryId(),
  name: "",
  productable_type: "",
  productable_id: "",
  productSearch: "",
  provider: "",
  region: "",
  price: "",
  objectStorageQuota: "1",
  objectStoragePricePerGb: DEFAULT_OBJECT_STORAGE_PRICE_PER_GB.toString(),
  options: [],
  loadingOptions: false,
  errors: {},
});

const coerceTrimmedString = (val: any): string => {
  if (val === null || val === undefined) return "";
  return String(val).trim();
};

const normalizeType = (raw: any): string => {
  if (raw === null || raw === undefined) return "";
  const value = String(raw).trim().toLowerCase();

  const aliases: Record<string, string> = {
    "compute instance": "compute_instance",
    compute: "compute_instance",
    "cross connect": "cross_connect",
    "cross-connect": "cross_connect",
    "os image": "os_image",
    "operating system": "os_image",
    bandwidth: "bandwidth",
    "floating ip": "ip",
    floating_ip: "ip",
    ip: "ip",
    "object storage": OBJECT_STORAGE_TYPE,
    object_storage: OBJECT_STORAGE_TYPE,
    "volume type": "volume_type",
    volume: "volume_type",
  };

  if (aliases[value]) {
    return aliases[value];
  }

  return value.replace(/[-\s]+/g, "_");
};

export const mapRowToEntry = (
  row: any,
  rowIndex: number,
  regionMap: Record<string, any>
): { entry?: ProductEntry; error?: { row: number; message: string } } => {
  const rowLabel = rowIndex + 2; // account for header row

  const name = coerceTrimmedString(row.name ?? row.product_name ?? row.Name ?? row["Product Name"]);
  const region = coerceTrimmedString(row.region ?? row.region_code ?? row.Region ?? row["Region"]);
  const rawType = row.productable_type ?? row.type ?? row.ProductType ?? row["Product Type"];
  const productableType = normalizeType(rawType);
  const rawProductId = row.productable_id ?? row.product_id ?? row.ProductID ?? row["Product ID"];
  const productableIdNumber = Number(rawProductId);
  const rawPrice = row.price ?? row.price_usd ?? row.Price ?? row["Price"] ?? row["priceUSD"];
  const priceNumber = Number(rawPrice);

  if (!name) {
    return { error: { row: rowLabel, message: "Missing product name." } };
  }

  if (!region) {
    return { error: { row: rowLabel, message: "Missing region." } };
  }

  const regionInfo = regionMap[region];
  if (!regionInfo) {
    return {
      error: {
        row: rowLabel,
        message: `Unknown region '${region}'.`,
      },
    };
  }

  const allowedTypes = new Set(productTypes.map((type) => type.value));
  if (!productableType || !allowedTypes.has(productableType)) {
    return {
      error: {
        row: rowLabel,
        message: "Invalid or missing product type.",
      },
    };
  }

  if (productableType === OBJECT_STORAGE_TYPE) {
    const quota =
      Number.isFinite(productableIdNumber) && productableIdNumber > 0
        ? Math.floor(productableIdNumber)
        : 1;
    const resolvedPrice =
      Number.isFinite(priceNumber) && priceNumber > 0
        ? Number(priceNumber.toFixed(4))
        : Number((quota * DEFAULT_OBJECT_STORAGE_PRICE_PER_GB).toFixed(4));
    const pricePerGb =
      quota > 0 && resolvedPrice > 0
        ? Number((resolvedPrice / quota).toFixed(4))
        : DEFAULT_OBJECT_STORAGE_PRICE_PER_GB;

    const entry: ProductEntry = {
      ...createEmptyEntry(),
      name: name || objectStorageNameForQuota(quota),
      productable_type: productableType,
      productable_id: String(quota),
      productSearch: "",
      provider: regionInfo.provider ?? "",
      region,
      price: resolvedPrice.toFixed(4),
      objectStorageQuota: String(quota),
      objectStoragePricePerGb: pricePerGb.toString(),
    };
    return { entry };
  }

  if (!Number.isFinite(productableIdNumber) || productableIdNumber <= 0) {
    return {
      error: {
        row: rowLabel,
        message: "Product ID must be a positive number.",
      },
    };
  }

  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return {
      error: {
        row: rowLabel,
        message: "Price must be a positive number.",
      },
    };
  }

  const entry: ProductEntry = {
    ...createEmptyEntry(),
    name,
    productable_type: productableType,
    productable_id: String(productableIdNumber),
    productSearch: "",
    provider: regionInfo.provider ?? "",
    region,
    price: priceNumber.toString(),
  };
  return { entry };
};
