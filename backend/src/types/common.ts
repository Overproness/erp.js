// Common shared TypeScript types

export interface PaginationInfo {
  page: number;
  count: number;
  pages: number;
  total?: number;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortValue?: string;
}

export interface FilterInput {
  field: string;
  value: string;
}

export interface MutationResponse {
  success: boolean;
  result?: any;
  message: string;
}

export interface ListResponse<T = any> {
  success: boolean;
  result?: T[];
  pagination?: PaginationInfo;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  result?: any;
  message: string;
}

export interface BatchResponse<T = any> {
  success: boolean;
  result?: T[];
  message: string;
  count?: number;
}
