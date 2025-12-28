// ============================================
// API Response Helpers
// ============================================

import { Response } from 'express';

interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: ApiMeta,
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: Record<string, string[]>
): void {
  const error: ApiError = { code, message };
  if (details) {
    error.details = details;
  }
  
  res.status(statusCode).json({
    success: false,
    error,
  });
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  page: number,
  limit: number,
  total: number
): void {
  sendSuccess(res, items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

// Common error responses
export const errors = {
  unauthorized: (res: Response, message = 'Unauthorized') =>
    sendError(res, 'UNAUTHORIZED', message, 401),
  
  forbidden: (res: Response, message = 'Forbidden') =>
    sendError(res, 'FORBIDDEN', message, 403),
  
  notFound: (res: Response, resource = 'Resource') =>
    sendError(res, 'NOT_FOUND', `${resource} not found`, 404),
  
  validation: (res: Response, details: Record<string, string[]>) =>
    sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, details),
  
  serverError: (res: Response, message = 'Internal server error') =>
    sendError(res, 'SERVER_ERROR', message, 500),
};

