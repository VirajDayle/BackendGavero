/**
 * shared/types/api.types.ts
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export type ID = string | number;
