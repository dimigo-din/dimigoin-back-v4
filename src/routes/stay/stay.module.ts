import { Module } from "@nestjs/common";
import { UserManageService } from "~user/providers";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  controllers: Object.values(controllers),
  providers: [...Object.values(providers), UserManageService],
  exports: Object.values(providers),
})
export class StayModule {}
