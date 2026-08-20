import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GlobalRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Hierarchy: Higher rank includes permissions of lower ranks
const ROLE_HIERARCHY: Record<GlobalRole, number> = {
  [GlobalRole.SUPERADMIN]: 5,
  [GlobalRole.ADMIN]: 4,
  [GlobalRole.TECH_LEAD]: 3,
  [GlobalRole.DEVELOPER]: 2,
  [GlobalRole.GUEST]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<GlobalRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.globalRole) {
      throw new ForbiddenException('No tienes permisos suficientes para acceder a este recurso');
    }

    // SuperAdmin always has access
    if (user.globalRole === GlobalRole.SUPERADMIN) {
      return true;
    }

    // Direct match check
    const hasRole = requiredRoles.some((role) => user.globalRole === role);
    if (hasRole) {
      return true;
    }

    // Check minimum required role hierarchy
    const userRank = ROLE_HIERARCHY[user.globalRole as GlobalRole] || 0;
    const minRequiredRank = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r] || 0));

    if (userRank >= minRequiredRank) {
      return true;
    }

    throw new ForbiddenException(
      `Acceso denegado: tu rol (${user.globalRole}) no cuenta con los privilegios requeridos`,
    );
  }
}
