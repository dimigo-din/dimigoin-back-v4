import { CACHE_MANAGER, CacheModule } from "@nestjs/cache-manager";
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CustomCacheModule } from "../common/modules/cache.module";
import { CustomConfigModule } from "../common/modules/config.module";
import { CustomJWTModule } from "../common/modules/jwt.module";
import { UserModule } from "../routes";
import { Login, Session, User } from "../schemas";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CustomJwtStrategy } from "./guards/jwt.strategy";
import { PersonalInformationVerifyTokenStrategy } from "./guards/personalInformationVerifyToken.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([Login, Session, User]),
    CustomJWTModule,
    CustomConfigModule,
    CustomCacheModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, CustomJwtStrategy, PersonalInformationVerifyTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
