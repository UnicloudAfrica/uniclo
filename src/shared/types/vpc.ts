import { ApiResponse } from "./resource";

export interface Vpc {
  id: string;
  name: string;
  cidr_block: string;
  region: string;
  project_id: string;
  status: string;
  is_default?: boolean;
}

export interface VpcFlowLog {
  id: string;
  vpc_id: string;
  name: string;
  description?: string;
  log_group_name?: string;
  traffic_type: "ACCEPT" | "REJECT" | "ALL";
  status: string;
}

export interface CidrSuggestion {
  cidr: string;
  available: boolean;
}

export type VpcApiResponse<T = unknown> = ApiResponse<T>;
