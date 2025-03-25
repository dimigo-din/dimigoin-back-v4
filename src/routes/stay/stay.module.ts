import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import {
  User,
  Stay,
  StayApplyPeriod_Stay,
  StayApplyPeriod_StaySchedule,
  StaySchedule,
  StaySeatPreset,
  StaySeatPresetRange,
  StayApply,
} from "../../schemas";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Stay,
      StayApply,
      StaySeatPreset,
      StaySeatPresetRange,
      StaySchedule,
      StayApplyPeriod_Stay,
      StayApplyPeriod_StaySchedule,
    ]),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers)],
  exports: importToArray(providers),
})
export class StayModule {}
