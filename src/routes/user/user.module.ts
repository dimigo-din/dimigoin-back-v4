import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "#/auth";
import { LaundryApply, Login, StayApply, User } from "#/schemas";
import { CustomCacheModule } from "$modules/cache.module";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Login, StayApply, LaundryApply]),
    CustomCacheModule,
    forwardRef(() => AuthModule),
  ],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers)],
  exports: Object.values(providers),
})
export class UserModule {}
