/**
 * Admin Region API - Barrel Export
 *
 * Re-exports all types and functions from the sub-modules, and provides a
 * default export that matches the original class-based singleton interface
 * so existing callers (`adminRegionApi.approveRegion(...)`) continue to work.
 */

// Re-export all types
export type {
  ApiResponse,
  RegionApproval,
  ProviderService,
  CredentialStatus,
  ObjectStorageConfig,
  FastTrackGrant,
  RegionCreatePayload,
  RegionUpdatePayload,
} from "./types";

// Re-export all approval functions
export {
  fetchRegionApprovals,
  fetchRegionApprovalById,
  approveRegion,
  rejectRegion,
  suspendRegion,
  reactivateRegion,
  updateFastTrackSettings,
  grantFastTrack,
  revokeFastTrack,
  updatePlatformFee,
  deleteRegion,
} from "./approvals";

// Re-export all region management functions
export {
  createPlatformRegion,
  fetchRegionByCode,
  updateRegion,
  updateVisibility,
  verifyRegion,
  unverifyRegion,
} from "./regions";

// Re-export all credential functions
export {
  verifyCredentials,
  verifyObjectStorage,
  getProviderServices,
  getCredentialStatus,
  storeServiceCredentials,
  verifyServiceCredentials,
  deleteServiceCredentials,
  verifyProviderServiceCredentials,
} from "./credentials";

// ---- Backward-compatible default export ----
// Existing code does: import adminRegionApi from "@/services/adminRegionApi";
//                     adminRegionApi.approveRegion(id, data);
// We compose a plain object with every method so the call-sites keep working.

import * as approvals from "./approvals";
import * as regions from "./regions";
import * as credentials from "./credentials";
import { getAuthHeaders } from "./helpers";

const adminRegionApi = {
  // helpers
  getAuthHeaders,

  // approvals
  fetchRegionApprovals: approvals.fetchRegionApprovals,
  fetchRegionApprovalById: approvals.fetchRegionApprovalById,
  approveRegion: approvals.approveRegion,
  rejectRegion: approvals.rejectRegion,
  suspendRegion: approvals.suspendRegion,
  reactivateRegion: approvals.reactivateRegion,
  updateFastTrackSettings: approvals.updateFastTrackSettings,
  grantFastTrack: approvals.grantFastTrack,
  revokeFastTrack: approvals.revokeFastTrack,
  updatePlatformFee: approvals.updatePlatformFee,
  deleteRegion: approvals.deleteRegion,

  // regions
  createPlatformRegion: regions.createPlatformRegion,
  fetchRegionByCode: regions.fetchRegionByCode,
  updateRegion: regions.updateRegion,
  updateVisibility: regions.updateVisibility,
  verifyRegion: regions.verifyRegion,
  unverifyRegion: regions.unverifyRegion,

  // credentials
  verifyCredentials: credentials.verifyCredentials,
  verifyObjectStorage: credentials.verifyObjectStorage,
  getProviderServices: credentials.getProviderServices,
  getCredentialStatus: credentials.getCredentialStatus,
  storeServiceCredentials: credentials.storeServiceCredentials,
  verifyServiceCredentials: credentials.verifyServiceCredentials,
  deleteServiceCredentials: credentials.deleteServiceCredentials,
  verifyProviderServiceCredentials: credentials.verifyProviderServiceCredentials,
};

export default adminRegionApi;
