import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CustomConfigModule } from "../common/modules/config.module";
import { CustomJWTModule } from "../common/modules/jwt.module";
import { UserModule } from "../routes";
import { Login, OAuth_Client, OAuth_Client_Redirect, OAuth_Code, Session, User } from "../schemas";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CustomJwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Login,
      Session,
      OAuth_Client,
      OAuth_Client_Redirect,
      OAuth_Code,
      User,
    ]),
    CustomJWTModule,
    CustomConfigModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, CustomJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
