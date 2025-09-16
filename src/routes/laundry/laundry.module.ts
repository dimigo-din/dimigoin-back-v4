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
  PushSubscription
} from "../../schemas";
import { UserManageService } from "../user/providers";
import { PushManageService } from "../push/providers";

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
      PushSubscription
    ]),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers), UserManageService, PushManageService],
  exports: importToArray(providers),
})
export class LaundryModule {}
