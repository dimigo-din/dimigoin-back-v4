import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FrigoApply, FrigoApplyPeriod, Login, User } from "#/schemas";
import { UserManageService } from "~user/providers";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [TypeOrmModule.forFeature([User, Login, FrigoApply, FrigoApplyPeriod])],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers), UserManageService],
  exports: Object.values(providers),
})
export class FrigoModule {}
