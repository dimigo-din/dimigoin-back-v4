import { CanActivate, ExecutionContext, mixin } from "@nestjs/common";

import { PermissionEnum } from "../../common/mapper/permissions";
import { hasPermission } from "../../common/utils/permission.util";

export const PermissionGuard = (
  requiredPermission: number[],
  or: boolean = false,
  withoutSignup: boolean = false,
) => {
  class PermissionGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      return hasPermission(
        request.user.permission,
        [...requiredPermission, ...(withoutSignup ? [] : [PermissionEnum.SIGNUP_COMPLETE])],
        or,
      );
    }
  }

  return mixin(PermissionGuardMixin);
};
