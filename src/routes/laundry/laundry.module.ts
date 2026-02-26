import { Module } from "@nestjs/common";
import { CacheService } from "$modules/cache.module";
import { PushManageService } from "~push/providers";
import { UserManageService } from "~user/providers";

import * as controllers from "./controllers";
import * as providers from "./providers";
import * as schedulers from "./schedulers";

@Module({
  controllers: Object.values(controllers),
  providers: [
    ...Object.values(providers),
    ...Object.values(schedulers),
    UserManageService,
    PushManageService,
    CacheService,
  ],
  exports: Object.values(providers),
})
export class LaundryModule {}
