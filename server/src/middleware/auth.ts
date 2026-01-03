// ============================================
// Authentication Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { errors } from '../utils/apiResponse';

// Extend Express Request type
declare global {
  namespace Express {
    interface User {
      id: string;
      steamId: string;
      username: string;
      avatar?: string;
      roles: {
        id: string;
        name: string;
        color: string;
        permissions: { key: string }[];
      }[];
    }
  }
}

// Check if user is authenticated
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  errors.unauthorized(res, 'You must be logged in to access this resource');
}

// Check if user has specific permission
export function hasPermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return errors.unauthorized(res);
    }

    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return errors.unauthorized(res);
    }

    // Collect all user permissions
    const userPermissions = new Set<string>();
    for (const userRole of user.roles) {
      for (const rolePermission of userRole.role.permissions) {
        userPermissions.add(rolePermission.permission.key);
      }
    }

    // Check if user has any of the required permissions
    const hasRequiredPermission = permissions.some(p => userPermissions.has(p));

    if (!hasRequiredPermission) {
      return errors.forbidden(res, 'You do not have permission to access this resource');
    }

    next();
  };
}

// Check if user has admin access
export const isAdmin = hasPermission('admin.access');

// Check if user is the resource owner or has admin permission
export function isOwnerOrAdmin(getUserId: (req: Request) => string | undefined) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return errors.unauthorized(res);
    }

    const resourceUserId = getUserId(req);

    // Allow if user is the owner
    if (resourceUserId === req.user.id) {
      return next();
    }

    // Check for admin permission
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return errors.unauthorized(res);
    }

    const isAdminUser = user.roles.some(ur =>
      ur.role.permissions.some(rp => rp.permission.key === 'admin.access')
    );

    if (!isAdminUser) {
      return errors.forbidden(res, 'You can only access your own resources');
    }

    next();
  };
}

// Aliases for consistency with new routes
export const requireAuth = isAuthenticated;
export const requirePermission = hasPermission;

