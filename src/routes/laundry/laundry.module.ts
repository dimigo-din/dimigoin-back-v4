import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import {
  Login,
  User,
  LaundryMachine,
  LaundryTime,
  LaundryTimeline,
  LaundryApply,
  Stay,
} from "../../schemas";
import { UserManageService } from "../user/providers";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Stay,
      Login,
      LaundryTime,
      LaundryApply,
      LaundryMachine,
      LaundryTimeline,
    ]),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers), UserManageService],
  exports: importToArray(providers),
})
export class LaundryModule {}
