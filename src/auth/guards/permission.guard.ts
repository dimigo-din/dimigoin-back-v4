import { CanActivate, ExecutionContext, mixin } from "@nestjs/common";

import { PermissionEnum } from "../../common/mapper/permissions";
import { hasPermission, parsePermission } from "../../common/utils/permission.util";

export const PermissionGuard = (requiredPermission: number[], or: boolean = false) => {
  class PermissionGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      console.log(parsePermission(request.user.permission));
      return hasPermission(request.user.permission, requiredPermission, or);
    }
  }

  return mixin(PermissionGuardMixin);
};
