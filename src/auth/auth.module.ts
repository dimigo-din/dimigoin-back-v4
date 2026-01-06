import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CustomCacheModule } from "../common/modules/cache.module";
import { CustomConfigModule } from "../common/modules/config.module";
import { CustomJWTModule } from "../common/modules/jwt.module";
import { UserModule } from "../routes";
import { Login, Session, User } from "../schemas";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Login, Session, User]),
    CustomJWTModule,
    CustomConfigModule,
    CustomCacheModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
