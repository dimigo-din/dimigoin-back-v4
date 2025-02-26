import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import { AuthModule } from "../../auth";
import { AuthService } from "../../auth/auth.service";
import { Login, User } from "../../schemas";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [TypeOrmModule.forFeature([User, Login]), forwardRef(() => AuthModule)],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers)],
  exports: importToArray(providers),
})
export class UserModule {}
