import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import {
  Login,
  Stay,
  StayApply,
  StayApplyPeriod_Stay,
  StayApplyPeriod_StaySchedule,
  StayOuting,
  StaySchedule,
  StaySeatPreset,
  StaySeatPresetRange,
  User,
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
      StayApply,
      StayOuting,
      StaySchedule,
      StaySeatPreset,
      StaySeatPresetRange,
      StayApplyPeriod_Stay,
      StayApplyPeriod_StaySchedule,
    ]),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers), UserManageService],
  exports: importToArray(providers),
})
export class StayModule {}
