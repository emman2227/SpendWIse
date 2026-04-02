import type { ApiResponse } from '../types/api';

export const withApiMeta = <T>(data: T): ApiResponse<T> => ({
  data,
  meta: {
    timestamp: new Date().toISOString()
  }
});
