import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  LaundryApply,
  LaundryMachine,
  LaundryTime,
  LaundryTimeline,
  Login,
  PushSubscription,
  Stay,
  User,
} from "#/schemas";
import { CacheService } from "$modules/cache.module";
import { PushManageService } from "~push/providers";
import { UserManageService } from "~user/providers";

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
  controllers: Object.values(controllers),
  providers: [
    ...Object.values(providers),
    ...Object.values(schedulers),
    UserManageService,
    PushManageService,
    CacheService,
  ],
  exports: Object.values(providers),
})
export class LaundryModule {}
