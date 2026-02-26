import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "#/auth";
import { CustomCacheModule } from "$modules/cache.module";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [CustomCacheModule, forwardRef(() => AuthModule)],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers)],
  exports: Object.values(providers),
})
export class UserModule {}
