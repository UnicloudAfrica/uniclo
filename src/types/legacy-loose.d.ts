/* Transitional compatibility types for JS->TS migration */

export {};

declare global {
  interface Date {
    today(): string;
    timeNow(): string;
  }
}
