import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from 'src/api/user/user.service';

@Injectable()
export class ViewPermissionGuard implements CanActivate {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();
    const user = req.user;

    const service = req.path.split('/')[1];
    const permission = await this.userService.getPermissionByGroup(user.groups);
    user.permissions.view.push(...permission.view);
    user.permissions.edit.push(...permission.edit);

    if (
      !user.permissions.view.includes(service) &&
      !user.permissions.view.includes('@')
    )
      return false;
    return true;
  }
}
