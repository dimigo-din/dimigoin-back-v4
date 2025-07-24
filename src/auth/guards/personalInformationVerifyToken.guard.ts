import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class PersonalInformationVerifyTokenAuthGuard extends AuthGuard(
  "personalInformationVerifyToken",
) {
  canActivate(context: ExecutionContext): any {
    return super.canActivate(context);
  }
}
