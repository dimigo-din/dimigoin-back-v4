import { CanActivate, ExecutionContext, mixin } from "@nestjs/common";

import { PermissionEnum } from "../../common/mapper/permissions";
import { hasPermission, parsePermission } from "../../common/utils/permission.util";

// TODO: scope based permission management
export const PermissionGuard = (requiredPermission: number[], or: boolean = false) => {
  class PermissionGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      return hasPermission(request.user.permission, requiredPermission, or);
    }
  }

  return mixin(PermissionGuardMixin);
};
