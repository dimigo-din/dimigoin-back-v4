import { Module } from "@nestjs/common";
import { CustomCacheModule } from "$modules/cache.module";
import { UserModule } from "~user/user.module";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [UserModule, CustomCacheModule],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers)],
  exports: Object.values(providers),
})
export class FacilityModule {}
