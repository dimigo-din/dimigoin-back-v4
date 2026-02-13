import { Module } from "@nestjs/common";
import { CustomCacheModule } from "$modules/cache.module";
import { UserManageService } from "~user/providers";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [CustomCacheModule],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers), UserManageService],
  exports: Object.values(providers),
})
export class WakeupModule {}
