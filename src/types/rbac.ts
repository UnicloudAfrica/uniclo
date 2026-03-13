/**
 * RBAC types for the unified permission system.
 */

export type PermissionKey = string;

export interface PermissionEntry {
  key: string;
  label: string;
  granted: boolean;
}

export interface PermissionGroup {
  group: string;
  permissions: PermissionEntry[];
}

export interface PermissionRegistry {
  [group: string]: string[];
}

export interface UserPermissionOverride {
  permission: string;
  granted: boolean;
}

export interface PermissionResponse {
  permissions: string[];
  scope: string;
}

export interface UserPermissionsData {
  user_id: number;
  role: string;
  permissions: string[];
  registry: PermissionRegistry;
}

export interface ClientTeamMember {
  id: number;
  owner_user_id: number;
  member_user_id: number;
  tenant_id: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
  accepted_at: string | null;
  is_accepted: boolean;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
  member?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}
