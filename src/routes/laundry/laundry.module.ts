import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import { CacheService } from "../../common/modules/cache.module";
import {
  Login,
  User,
  LaundryMachine,
  LaundryTime,
  LaundryTimeline,
  LaundryApply,
  Stay,
  PushSubscription,
} from "../../schemas";
import { PushManageService } from "../push/providers";
import { UserManageService } from "../user/providers";

import * as controllers from "./controllers";
import * as providers from "./providers";
import * as schedulers from "./schedulers";

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
      PushSubscription,
    ]),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers), ...importToArray(schedulers),UserManageService, PushManageService, CacheService],
  exports: importToArray(providers),
})
export class LaundryModule {}
