/**
 * Admin Region Approval API Service
 *
 * This file is now a barrel re-export. The implementation has been split into
 * domain-specific modules under ./adminRegion/:
 *
 *   - types.ts       Shared interfaces (ApiResponse, RegionApproval, etc.)
 *   - helpers.ts     Auth header helper
 *   - approvals.ts   Region approval workflow endpoints
 *   - regions.ts     Region management endpoints
 *   - credentials.ts Credential management endpoints
 *   - index.ts       Barrel that re-exports everything + default singleton
 */

export * from "./adminRegion";
export { default } from "./adminRegion";
