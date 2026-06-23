export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, any>;
}

export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>,
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta,
  };
}

export function errorResponse(
  error: string,
  message?: string,
): ApiResponse {
  return {
    success: false,
    error,
    message,
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
