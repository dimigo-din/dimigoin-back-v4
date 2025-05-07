import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import {
  FrigoApply,
  FrigoApplyPeriod,
  Login,
  PersonalInformationSchema,
  User,
} from "../../schemas";
import { UserManageService } from "../user/providers";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Login,
      FrigoApply,
      FrigoApplyPeriod,
      PersonalInformationSchema, // temporally
    ]),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers), UserManageService],
  exports: importToArray(providers),
})
export class FrigoModule {}
