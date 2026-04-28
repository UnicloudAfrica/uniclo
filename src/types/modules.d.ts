declare module "react-datepicker";
declare module "papaparse";
// L-01: @sentry/react is installed and ships real types — removed the
// empty `declare module` stub so the real .d.ts resolves.

// topojson-client — runtime package, no bundled types
declare module "topojson-client" {
  export function feature(topology: unknown, object: unknown): unknown;
  export function mesh(topology: unknown, object: unknown, filter?: unknown): unknown;
  export function merge(topology: unknown, objects: unknown[]): unknown;
}

// topojson-specification — minimal Topology shape
declare module "topojson-specification" {
  export interface Topology {
    type: string;
    objects: Record<string, unknown>;
    arcs: unknown[];
    bbox?: number[];
    transform?: { scale: [number, number]; translate: [number, number] };
    [key: string]: unknown;
  }
}
