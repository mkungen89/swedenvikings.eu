// ============================================
// Validation Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errors } from '../utils/apiResponse';

export function validate(req: Request, res: Response, next: NextFunction): void {
  const result = validationResult(req);
  
  if (!result.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};
    
    for (const error of result.array()) {
      const field = error.type === 'field' ? error.path : 'general';
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    }
    
    errors.validation(res, formattedErrors);
    return;
  }
  
  next();
}

