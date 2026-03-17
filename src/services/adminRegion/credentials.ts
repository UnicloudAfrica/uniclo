/**
 * Admin Region API - Credential Management Endpoints
 *
 * Handles provider service discovery, credential storage, verification,
 * deletion, and object-storage verification.
 */

import config from "../../config";
import ToastUtils from "../../utils/toastUtil";
import logger from "../../utils/logger";
import { getAuthHeaders } from "./helpers";
import type { ApiResponse, CredentialStatus, ProviderService } from "./types";

/**
 * Verify MSP admin credentials for platform-owned regions.
 * Admin can only verify credentials for regions they create (platform-owned).
 */
export async function verifyCredentials(
  identifier: string | number,
  credentials: Record<string, unknown>,
  options: { scope?: string } = {}
): Promise<ApiResponse<null>> {
  const scope = options.scope || "region";
  const path =
    scope === "approval"
      ? `region-approvals/${identifier}/verify-credentials`
      : `regions/${identifier}/verify-credentials`;

  try {
    const response = await fetch(`${config.adminURL}/${path}`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      return {
        success: true,
        data: null,
        message: data.message || "Credentials verified successfully",
        verified: data.verified ?? true,
        credentials_updated_at: data.credentials_updated_at,
      };
    } else {
      throw new Error(data.message || "Failed to verify credentials");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error verifying credentials for region ${identifier}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Verify object storage configuration for a region
 */
export async function verifyObjectStorage(
  regionCode: string,
  payload: Record<string, unknown> | null = null
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${config.adminURL}/regions/${regionCode}/verify-object-storage`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: payload ? JSON.stringify(payload) : JSON.stringify({}),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      return {
        success: true,
        data: null,
        message: data.message || "Object storage verified successfully",
      };
    }

    throw new Error(data.message || "Failed to verify Silo Storage");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error verifying Silo Storage for region ${regionCode}:`, error);
    ToastUtils.error(message || "Failed to verify Silo Storage");
    throw error;
  }
}

/**
 * Get available services and their credential field definitions for a provider
 * @param provider - Provider code (zadara, aws, azure, gcp)
 */
export async function getProviderServices(
  provider: string
): Promise<ApiResponse<ProviderService[]>> {
  try {
    const response = await fetch(`${config.adminURL}/providers/${provider}/services`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success || response.ok) {
      return {
        success: true,
        data: data.data || data,
      };
    }

    throw new Error(data.message || "Failed to fetch provider services");
  } catch (error: unknown) {
    logger.error(`Error fetching services for provider ${provider}:`, error);
    throw error;
  }
}

/**
 * Get credential status for all services in a region
 * @param regionId - Region ID or code
 */
export async function getCredentialStatus(
  regionCode: string
): Promise<ApiResponse<CredentialStatus[]>> {
  try {
    const response = await fetch(`${config.adminURL}/regions/${regionCode}/credentials`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success || response.ok) {
      return {
        success: true,
        data: data.data || data,
      };
    }

    throw new Error(data.message || "Failed to fetch credential status");
  } catch (error: unknown) {
    logger.error(`Error fetching credential status for region ${regionCode}:`, error);
    throw error;
  }
}

/**
 * Store credentials for a specific service type
 * @param regionCode - Region code
 * @param serviceType - Service type (compute, object_storage, etc.)
 * @param credentials - Credential data
 * @param skipVerification - If true, store without verifying
 */
export async function storeServiceCredentials(
  regionCode: string,
  serviceType: string,
  credentials: Record<string, string>,
  skipVerification: boolean = false
): Promise<ApiResponse<null>> {
  try {
    const payload: Record<string, unknown> = { ...credentials };
    if (skipVerification) {
      payload["skip_verification"] = true;
    }

    const response = await fetch(
      `${config.adminURL}/regions/${regionCode}/credentials/${serviceType}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (data.success || response.ok) {
      const label = serviceType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      ToastUtils.success(data.message || `${label} credentials saved successfully`);
      return {
        success: true,
        data: data.data || null,
      };
    }

    throw new Error(data.message || `Failed to store ${serviceType} credentials`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error storing ${serviceType} credentials for region ${regionCode}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Verify credentials for a specific service type in a region
 */
export async function verifyServiceCredentials(
  regionCode: string,
  serviceType: string,
  credentials: Record<string, string>
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(
      `${config.adminURL}/regions/${regionCode}/credentials/${serviceType}/verify`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(credentials),
      }
    );

    const data = await response.json();

    if (data.success || response.ok) {
      return {
        success: true,
        data: null,
        message: data.message || "Credentials verified successfully",
      };
    }

    throw new Error(data.message || "Verification failed");
  } catch (error: unknown) {
    logger.error(`Error verifying ${serviceType} credentials for region ${regionCode}:`, error);
    throw error;
  }
}

/**
 * Delete credentials for a specific service type
 * @param regionCode - Region code
 * @param serviceType - Service type
 */
export async function deleteServiceCredentials(
  regionCode: string,
  serviceType: string
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(
      `${config.adminURL}/regions/${regionCode}/credentials/${serviceType}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (data.success || response.ok) {
      const label = serviceType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      ToastUtils.success(data.message || `${label} credentials deleted`);
      return {
        success: true,
        data: null,
      };
    }

    throw new Error(data.message || `Failed to delete ${serviceType} credentials`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error deleting ${serviceType} credentials for region ${regionCode}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

// ─── Availability Zone-scoped credential endpoints ───

/**
 * Get credential status for all services in an availability zone
 */
export async function getAZCredentialStatus(
  regionCode: string,
  azCode: string
): Promise<ApiResponse<CredentialStatus[]>> {
  try {
    const response = await fetch(
      `${config.adminURL}/regions/${regionCode}/availability-zones/${azCode}/credential-status`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (data.success || response.ok) {
      return { success: true, data: data.data || data };
    }

    throw new Error(data.message || "Failed to fetch AZ credential status");
  } catch (error: unknown) {
    logger.error(`Error fetching credential status for AZ ${azCode}:`, error);
    throw error;
  }
}

/**
 * Store credentials for a specific service type in an availability zone
 */
export async function storeAZServiceCredentials(
  regionCode: string,
  azCode: string,
  serviceType: string,
  credentials: Record<string, string>,
  skipVerification: boolean = false
): Promise<ApiResponse<null>> {
  try {
    const payload: Record<string, unknown> = { ...credentials };
    if (skipVerification) {
      payload["skip_verification"] = true;
    }

    const response = await fetch(
      `${config.adminURL}/regions/${regionCode}/availability-zones/${azCode}/credentials/${serviceType}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (data.success || response.ok) {
      const label = serviceType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      ToastUtils.success(data.message || `${label} credentials saved for AZ ${azCode}`);
      return { success: true, data: data.data || null };
    }

    throw new Error(data.message || `Failed to store ${serviceType} credentials for AZ`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error storing ${serviceType} credentials for AZ ${azCode}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Verify credentials for a specific service type in an availability zone
 */
export async function verifyAZServiceCredentials(
  regionCode: string,
  azCode: string,
  serviceType: string,
  credentials: Record<string, string>
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(
      `${config.adminURL}/regions/${regionCode}/availability-zones/${azCode}/credentials/${serviceType}/verify`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(credentials),
      }
    );

    const data = await response.json();

    if (data.success || response.ok) {
      return {
        success: true,
        data: null,
        message: data.message || "Credentials verified successfully",
      };
    }

    throw new Error(data.message || "Verification failed");
  } catch (error: unknown) {
    logger.error(`Error verifying ${serviceType} credentials for AZ ${azCode}:`, error);
    throw error;
  }
}

/**
 * Delete credentials for a specific service type in an availability zone
 */
export async function deleteAZServiceCredentials(
  regionCode: string,
  azCode: string,
  serviceType: string
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(
      `${config.adminURL}/regions/${regionCode}/availability-zones/${azCode}/credentials/${serviceType}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (data.success || response.ok) {
      const label = serviceType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      ToastUtils.success(data.message || `${label} credentials deleted for AZ ${azCode}`);
      return { success: true, data: null };
    }

    throw new Error(data.message || `Failed to delete ${serviceType} credentials for AZ`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error deleting ${serviceType} credentials for AZ ${azCode}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Verify credentials for a provider service before region creation
 */
export async function verifyProviderServiceCredentials(
  provider: string,
  serviceType: string,
  credentials: Record<string, string>
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(
      `${config.adminURL}/providers/${provider}/services/${serviceType}/verify`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(credentials),
      }
    );

    const data = await response.json();

    if (data.success || response.ok) {
      return {
        success: true,
        data: null,
        message: data.message || "Credentials verified successfully",
      };
    }

    throw new Error(data.message || "Verification failed");
  } catch (error: unknown) {
    logger.error(`Error verifying ${serviceType} credentials for provider ${provider}:`, error);
    throw error;
  }
}
