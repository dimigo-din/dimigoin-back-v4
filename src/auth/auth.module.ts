import { forwardRef, Module } from "@nestjs/common";
import { UserModule } from "#/routes";
import { AuthController } from "#auth/auth.controller";
import { AuthService } from "#auth/auth.service";
import { CustomCacheModule } from "$modules/cache.module";
import { CustomConfigModule } from "$modules/config.module";
import { CustomJWTModule } from "$modules/jwt.module";

@Module({
  imports: [CustomJWTModule, CustomConfigModule, CustomCacheModule, forwardRef(() => UserModule)],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
