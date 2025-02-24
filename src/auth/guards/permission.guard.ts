import { CanActivate, ExecutionContext, mixin } from "@nestjs/common";

import { hasPermission } from "../../common/utils/permission.util";

export const PermissionGuard = (requiredPermission: number[], or: boolean = false) => {
  class PermissionGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      return hasPermission(request.user.permission, requiredPermission, or);
    }
  }

  return mixin(PermissionGuardMixin);
};
